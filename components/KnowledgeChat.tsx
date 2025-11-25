
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Wand2, Loader, Terminal, ShoppingCart } from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type, ChatSession } from "@google/genai";
import { useProducts, useClient, useCart } from '../contexts/StoreContext';

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export const KnowledgeChat: React.FC = () => {
  const { products } = useProducts();
  const { evaluationData, clientInfo } = useClient();
  const { cart, updateQuantity, grandTotal } = useCart();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- HELPER: Simple Markdown Renderer ---
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle Lists
      if (line.trim().startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc mb-1">{renderBold(line.substring(2))}</li>;
      }
      if (line.trim().match(/^\d+\.\s/)) {
        return <li key={i} className="ml-4 list-decimal mb-1">{renderBold(line.replace(/^\d+\.\s/, ''))}</li>;
      }
      // Handle Paragraphs
      return <p key={i} className="min-h-[1.2em] mb-1 leading-relaxed">{renderBold(line)}</p>;
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // --- 1. SYSTEM INSTRUCTION (Static Baseline) ---
  const getSystemInstruction = () => {
    // Condensed Product List for Token Efficiency
    const productSnapshot = products
        .filter(p => p.isAvailable)
        .map(p => `[ID:${p.id}] ${p.name} ($${p.price.toFixed(2)}) Cat:${p.category} Wgt:${p.totalWeightGrams}g`)
        .join('\n');
    
    return `
    You are **Provizio**, the elite AI consultant for "Alimentation Mon Quartier" (AMQ). Your goal is to assist families and sales consultants in building the perfect **annual grocery plan**.

    ### 🧠 YOUR CORE KNOWLEDGE
    1.  **The "Concept AMQ"**: We sell high-quality meat and groceries in bulk (frozen) for a 12-month period to save money and reduce waste.
    2.  **Freezer Logic**: You know that 1 cubic foot of freezer space holds approx. 25 lbs of meat. You must warn users if their order exceeds their freezer capacity.
    3.  **Catalog Authority**: You have access to a [CATALOG SNAPSHOT] in the context. NEVER hallucinate products. If a product isn't in the list, suggest the closest alternative from the catalog.

    ### 📦 CATALOG SNAPSHOT
    ${productSnapshot}

    ### 🛠️ YOUR TOOLS & BEHAVIOR
    *   **Cart Management**: When a user expresses intent to buy, add, or increase stock (e.g., "Add 2 boxes of steaks", "We need more chicken"), you **MUST** call the 'addToCart' function immediately. Do not ask for confirmation unless the request is ambiguous.
    *   **Delivery Logic**: The plan consists of 4 deliveries per year. Unless specified, default new items to **Delivery 1**. If a user says "for summer", put it in Delivery 2 or 3.
    *   **Budget Awareness**: Always keep the user's total budget in mind. If they add expensive items (like Filet Mignon), gently remind them of the impact on the weekly cost if they seem budget-conscious.

    ### 👨‍🍳 CULINARY & SALES EXPERTISE
    *   **The "Butcher's Advice"**: If a user selects a tough cut (e.g., cubes, roasts), suggest slow-cooking methods. If they pick a premium cut, suggest simple searing.
    *   **Gap Analysis**: Look at the "Current Context". If the user has 50 lbs of beef but 0 lbs of chicken, ask: "I see you have a lot of red meat, should we balance this with some poultry for variety?"
    *   **Upselling**: If a user buys "Burgers", suggest "Bacon" or "Sausages" to complement the meal, but only if it fits the catalog.

    ### 📝 FORMATTING RULES
    *   Responses must be in **French** (unless the user speaks English).
    *   Use **Markdown** for clarity (bold for product names, lists for suggestions).
    *   Keep responses concise. Do not write long paragraphs. Focus on action and data.

    ### 🛡️ CRITICAL CONSTRAINTS
    *   **Safety**: If a user mentions a nut allergy or shellfish allergy, strictly warn them against products containing those allergens.
    *   **Zero-Waste**: Promote the idea of using every gram of food purchased.
    `;
  };

  // --- 2. TOOL DEFINITIONS ---
  const addToCartTool: FunctionDeclaration = {
    name: 'addToCart',
    description: 'Add a product to the user\'s cart.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productNameOrId: {
          type: Type.STRING,
          description: 'The exact ID or name of the product from the catalog.',
        },
        quantity: {
          type: Type.NUMBER,
          description: 'The number of units to add.',
        },
        deliveryIndex: {
          type: Type.NUMBER,
          description: 'Which delivery to add to (1, 2, 3, or 4). Default is 1.',
        }
      },
      required: ['productNameOrId', 'quantity'],
    },
  };

  // --- 3. INITIALIZATION ---
  useEffect(() => {
    const initChat = async () => {
      setIsInitializing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // A. Create Session
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: getSystemInstruction(),
            tools: [{ functionDeclarations: [addToCartTool] }],
          },
        });
        setChatSession(chat);

        // B. Proactive Suggestions (One-off generation)
        const suggestionPrompt = `
          Context: Family of ${evaluationData.adults} adults, ${evaluationData.children} children. 
          Current Cart Total: $${grandTotal}.
          Generate 3 short, actionable suggestions for the user (e.g. "Add staple beef?", "Fill freezer?").
          Return ONLY a JSON array of strings.
        `;
        
        const suggestionRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: suggestionPrompt,
            config: { responseMimeType: "application/json" }
        });
        
        const suggestionsJson = JSON.parse(suggestionRes.text || "[]");
        setSuggestions(suggestionsJson);
        
        setMessages([{
            id: 'init',
            role: 'model',
            content: `Bonjour! Je suis Provizio. Votre budget actuel est de **$${grandTotal.toFixed(2)}**. Comment puis-je vous aider à planifier votre année?`
        }]);

      } catch (e) {
        console.error("Init Error", e);
        setMessages([{ id: 'err', role: 'model', content: "Erreur de connexion au cerveau central." }]);
      } finally {
        setIsInitializing(false);
      }
    };

    if (!chatSession) initChat();
  }, []); // Run once on mount

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // --- 4. ACTION LOGIC ---
  const executeTool = (name: string, args: any): string => {
      if (name === 'addToCart') {
          const { productNameOrId, quantity, deliveryIndex = 1 } = args;
          
          const product = products.find(p => 
              p.id === productNameOrId || 
              p.name.toLowerCase().includes(productNameOrId.toLowerCase()) ||
              p.sku === productNameOrId
          );

          if (product) {
              updateQuantity(product, deliveryIndex, quantity);
              return `SUCCESS: Added ${quantity}x "${product.name}" to Delivery ${deliveryIndex}.`;
          } else {
              // Fuzzy search fallback
              const fuzzy = products.find(p => p.name.toLowerCase().includes(productNameOrId.toLowerCase()));
              if (fuzzy) {
                   updateQuantity(fuzzy, deliveryIndex, quantity);
                   return `SUCCESS: Found similar product. Added ${quantity}x "${fuzzy.name}" to Delivery ${deliveryIndex}.`;
              }
              return `ERROR: Product "${productNameOrId}" not found in catalog.`;
          }
      }
      return "ERROR: Unknown tool.";
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !chatSession) return;
    
    // UI Update
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Dynamic Context Injection
    const contextHeader = `
[CURRENT REAL-TIME CONTEXT]
- Cart Total: $${grandTotal.toFixed(2)}
- Item Count: ${cart.length} unique items
- Family: ${evaluationData.adults} Adults, ${evaluationData.children} Children
- Active Rules: ${localStorage.getItem('amq_automation_rules') ? 'Yes' : 'None'}

User Message: ${text}
    `;

    try {
        let response = await chatSession.sendMessage({ message: contextHeader });
        
        // Handle Tool Calls Loop
        while (response.functionCalls && response.functionCalls.length > 0) {
             const toolResponses = [];
             
             for (const call of response.functionCalls) {
                 // Show tool use in UI (optional, helpful for debug/trust)
                 setMessages(prev => [...prev, { 
                     id: `tool_${Date.now()}_${call.id}`, 
                     role: 'system', 
                     content: `🛠️ Exécution: ${call.name}(${JSON.stringify(call.args)})` 
                 }]);

                 const result = executeTool(call.name, call.args);
                 toolResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: result }
                 });
             }
             
             // Send tool results back to model to get final response
             response = await chatSession.sendToolResponse({
                functionResponses: toolResponses
             });
        }

        const modelMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            content: response.text || "Action terminée." 
        };
        setMessages(prev => [...prev, modelMsg]);

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { id: 'err', role: 'system', content: "Erreur de communication avec l'IA." }]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[700px] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-200">
                <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Provizio AI</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Connecté au Catalogue
                </div>
            </div>
        </div>
        <div className="text-right bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end"><ShoppingCart className="w-3 h-3"/> Total Panier</div>
             <div className="text-lg font-bold text-slate-900">${grandTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white scroll-smooth">
        {isInitializing && (
             <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3">
                 <Loader className="w-8 h-8 text-purple-600 animate-spin"/>
                 <p className="text-xs font-medium text-slate-500">Initialisation du contexte...</p>
             </div>
        )}
        
        {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                )}
                
                <div className={`
                    max-w-[85%] rounded-2xl p-4 text-sm relative shadow-sm
                    ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 
                      msg.role === 'system' ? 'bg-gray-50 text-gray-500 font-mono text-xs border border-gray-100 w-full' :
                      'bg-white border border-gray-100 text-slate-800 rounded-tl-sm'}
                `}>
                    {msg.role === 'system' && <div className="flex items-center gap-2 mb-1 border-b border-gray-200 pb-1"><Terminal className="w-3 h-3"/> Log Système</div>}
                    <div>{renderMessageContent(msg.content)}</div>
                </div>

                {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-slate-500" />
                    </div>
                )}
            </div>
        ))}
        
        {isThinking && (
            <div className="flex justify-start w-full pl-10">
                <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
          {suggestions.length > 0 && messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        className="whitespace-nowrap px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Sparkles className="w-3 h-3"/> {s}
                    </button>
                ))}
            </div>
          )}

          <div className="relative flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ex: Ajoutez 5 steaks pour la livraison 2..."
                disabled={isThinking || isInitializing}
                className="flex-1 bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
            />
            <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isThinking}
                className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-lg"
            >
                <Send className="w-5 h-5" />
            </button>
          </div>
      </div>
    </div>
  );
};
