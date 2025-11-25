
import React, { useState } from 'react';
import { Store, MapPin, Phone, Clock, Package, ArrowRight, Search, Plus, AlertCircle, ShoppingBag } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
    manager: string;
    status: 'open' | 'closed' | 'busy';
    stockLevel: 'high' | 'medium' | 'low';
}

const LOCAL_INVENTORY = [
  { id: '3333964', name: 'Pavé Saumon Fumé', price: 19.40 },
  { id: '1005390', name: 'Saumon Planché Cèdre Érable Et BBQ Unité', price: 19.40 },
  { id: '8268022', name: 'Magret De Canard', price: 29.20 },
  { id: '1006212', name: 'Smoked Meat Tranché', price: 10.80 },
  { id: '1007752', name: 'Feuilleté Saumon', price: 17.60 },
  { id: '1006403', name: 'Coquille De La Mer 300 G Unité', price: 15.10 },
  { id: '1002115', name: 'Côte Levée Porc 4 Côtes BBQ', price: 15.50 },
  { id: '1008513', name: 'Bœuf Joues Braisée', price: 22.50 },
  { id: '1009701', name: 'Gratin Dauphinois Unité', price: 3.00 },
  { id: '1000630', name: 'Truite Farcie Crevette Pétoncle', price: 19.40 },
  { id: '1007689', name: 'Homard Coquille 280 g Unité', price: 27.50 },
  { id: '1007684', name: 'Tournedos Poulet Nat.', price: 10.20 },
  { id: '1000616', name: 'Tournedos De Poulet BBQ', price: 10.60 },
  { id: '2388055', name: 'Jerky Saumon Fumé', price: 20.10 },
  { id: '1007943', name: 'Bajoue Morue All. Islande', price: 23.40 },
  { id: '6641830', name: 'Vivaneau A/Peau Unité 6 oz', price: 16.70 },
  { id: '1111286', name: 'Thon Steak 6 oz', price: 63.80 },
  { id: '1001286', name: 'Thon Saku 8 oz Unité', price: 87.10 },
  { id: '1002108', name: 'Brochette De Saumon À L\'Érable Unité', price: 14.20 },
  { id: '1002535', name: 'Brochette De Saumon 3 Poivres Unité', price: 14.20 },
  { id: '1009022', name: 'Poulet Brochette Souvlaki Unité', price: 14.90 },
  { id: '1002122', name: 'Tourte De Canard Confit Unité', price: 22.80 },
  { id: '7752022', name: 'Tartare Thon avec Marinade Asiatique', price: 19.50 },
  { id: '1003013', name: 'Tartare Au Deux Saumons Unité', price: 20.30 },
  { id: '1003273', name: 'Tartare De Bœuf Unité', price: 25.00 },
  { id: '1011484', name: 'Pilons de Canard Sauce BBQ Fumé Unité', price: 28.00 },
  { id: '8111880', name: 'Effiloché Bœuf Wellington', price: 26.90 },
  { id: '1003341', name: 'Tournedos De Poulet Méditerranéen Unité', price: 12.60 },
  { id: '1007424', name: 'Tournedos De Poulet Miel Et Ail Unité', price: 11.10 },
  { id: '1000821', name: 'Canard Cuisse Confite Unité', price: 19.60 },
  { id: '1007608', name: 'Poitrine Poulet Farcie Jamb/From/Bacon', price: 13.20 },
  { id: '1002276', name: 'Poitrine Poulet Farcie Brocoli Fromage Unité', price: 15.80 },
  { id: '6207731', name: 'Tourtière 4 Gibiers', price: 23.20 },
  { id: '8247520', name: 'Tourtière Saguenay-Lac-St-Jean', price: 41.70 },
  { id: '6207231', name: 'Pâté Au Saumon', price: 22.20 },
  { id: '1000448', name: 'Ragoût de Fèves de Lima Unité', price: 12.20 },
  { id: '1004111', name: 'Chili végé Unité', price: 14.40 },
  { id: '825882', name: 'Riz frit au Tofu Unité', price: 39.80 },
  { id: '1000435_P', name: 'Pieuvre Pattes Cuite', price: 10.00 },
  { id: '1000435_S', name: 'Sauce à spaghetti au poulet de grain', price: 13.60 },
  { id: '1001449', name: 'Feuilleté Mexicain Unité', price: 16.50 },
  { id: 'DHAL001', name: 'Dhal aux patates douces', price: 12.20 },
  { id: '100254', name: 'Sauce tartare de bœuf', price: 0.01 },
  { id: '1000726', name: 'Sauce À Spaghetti Unité', price: 20.10 },
  { id: '1000726_M', name: 'Sauce Fruits De Mer Unité', price: 11.10 },
  { id: '100242', name: 'Ratatouille Unité', price: 13.50 },
  { id: '100197', name: 'Orgetto aux Champignons Unité', price: 15.60 },
  { id: '100196', name: 'Mijoté de Lentilles Unité', price: 10.50 },
  { id: '100435_V', name: 'Pâté à la viande', price: 22.20 },
  { id: '100435_M', name: 'Pâté Mexicain', price: 25.80 },
  { id: '620783', name: 'Pâté au poulet', price: 24.40 },
  { id: '100460', name: 'Steak de flétan', price: 26.40 }
];

export const SuccursalesSection: React.FC = () => {
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inventorySearch, setInventorySearch] = useState('');

    const branches: Branch[] = [
        { 
            id: 1, 
            name: 'Alimentation Mon Quartier Mirabel', 
            address: '17285 rue Victor, unité 200, Mirabel, QC J7J 1P3', 
            phone: '450-666-5930', 
            manager: 'Équipe Mirabel', 
            status: 'open', 
            stockLevel: 'high' 
        },
        { 
            id: 2, 
            name: 'Alimentation Mon Quartier QG - Ste-Foy', 
            address: "990 rue de l'Église, bureau 200, Sainte-Foy, QC G1V 3V5", 
            phone: '418-521-8238', 
            manager: 'Équipe Ste-Foy', 
            status: 'busy', 
            stockLevel: 'high' 
        },
        { 
            id: 3, 
            name: 'Alimentation Mon Quartier Sherbrooke', 
            address: '1045 rue King Est, Sherbrooke, QC, J1G 1E4', 
            phone: '819-347-2687', 
            manager: 'Équipe Sherbrooke', 
            status: 'open', 
            stockLevel: 'medium' 
        },
        { 
            id: 4, 
            name: 'Alimentation Mon Quartier Saint-Rédempteur', 
            address: '2170, route des Rivières, suite 100, Lévis, QC, G6K 1A5', 
            phone: '418-521-8239', 
            manager: 'Équipe Lévis', 
            status: 'open', 
            stockLevel: 'medium' 
        },
        { 
            id: 5, 
            name: 'Alimentation Mon Quartier Gatineau', 
            address: '130 rue Gréber, suite 7, Gatineau, QC, J8T 6H5', 
            phone: '819-347-2686', 
            manager: 'Équipe Gatineau', 
            status: 'open', 
            stockLevel: 'high' 
        },
        { 
            id: 6, 
            name: 'Alimentation Mon Quartier Boucherville', 
            address: '650 rue Montbrun, Boucherville, QC, J4B 8G9', 
            phone: '450-666-5930', 
            manager: 'Équipe Boucherville', 
            status: 'busy', 
            stockLevel: 'high' 
        },
        { 
            id: 7, 
            name: 'Alimentation Mon Quartier Laval', 
            address: '5555 boul. des Laurentides, suite 15, Laval, QC, H7K 2K4', 
            phone: '450-666-5733', 
            manager: 'Équipe Laval', 
            status: 'open', 
            stockLevel: 'medium' 
        },
        { 
            id: 8, 
            name: 'Alimentation Mon Quartier Chicoutimi', 
            address: '350 rue du Havre, Chicoutimi, QC, G7H 1N4', 
            phone: '418-521-8240', 
            manager: 'Équipe Chicoutimi', 
            status: 'open', 
            stockLevel: 'low' 
        },
        { 
            id: 9, 
            name: 'Alimentation Mon Quartier Rouyn-Noranda', 
            address: '65, rue Mgr-Tessier Ouest, Rouyn-Noranda, QC, J9X 2S5', 
            phone: '819-569-9607', 
            manager: 'Équipe Rouyn', 
            status: 'open', 
            stockLevel: 'medium' 
        },
        { 
            id: 10, 
            name: 'Alimentation Mon Quartier Trois-Rivières', 
            address: '4380, côte Rosemont, Trois-Rivières, QC, G8Y 0A5', 
            phone: '418-521-8253', 
            manager: 'Équipe Trois-Rivières', 
            status: 'open', 
            stockLevel: 'high' 
        }
    ];

    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredInventory = LOCAL_INVENTORY.filter(item => 
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
        item.id.includes(inventorySearch)
    );

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'open': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-red-100 text-red-700';
            case 'busy': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto h-[calc(100vh-8rem)] flex flex-col">
           {/* Header */}
           <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Store className="w-8 h-8 text-blue-600" /> 
                        Réseau & Succursales
                    </h2>
                    <p className="text-slate-500 mt-1">11 succursales AMQ pour vous servir.</p>
                </div>
                {selectedBranch ? (
                    <button onClick={() => setSelectedBranchId(null)} className="text-slate-500 font-bold hover:text-slate-800 flex items-center gap-2">
                         Retour à la liste
                    </button>
                ) : (
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une succursale..." 
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
           </div>

           {/* Content Area */}
           <div className="flex-1 min-h-0 overflow-hidden">
               {!selectedBranch ? (
                   /* LIST VIEW */
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pr-2 pb-4">
                       {filteredBranches.map(branch => (
                           <button 
                                key={branch.id} 
                                onClick={() => setSelectedBranchId(branch.id)}
                                className="group text-left bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                           >
                               <div className="flex justify-between items-start mb-4 w-full">
                                   <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors`}>
                                       <Store className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                   </div>
                                   <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getStatusColor(branch.status)}`}>
                                       {branch.status === 'open' ? 'Ouvert' : branch.status === 'busy' ? 'Achalandé' : 'Fermé'}
                                   </span>
                               </div>
                               
                               <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-blue-700 transition-colors line-clamp-1" title={branch.name}>{branch.name}</h3>
                               <div className="space-y-2 mt-4 flex-1">
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 flex-shrink-0" /> <span className="line-clamp-2">{branch.address}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Phone className="w-4 h-4 flex-shrink-0" /> {branch.phone}
                                    </p>
                               </div>

                               <div className="mt-6 pt-4 border-t border-gray-100 w-full flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Package className="w-4 h-4" /> Stock: <span className={branch.stockLevel === 'low' ? 'text-red-500' : 'text-green-600'}>{branch.stockLevel === 'low' ? 'Limité' : 'Stable'}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-full p-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                               </div>
                           </button>
                       ))}
                   </div>
               ) : (
                   /* DETAIL VIEW */
                   <div className="h-full flex flex-col lg:flex-row gap-6">
                       {/* Left Sidebar: Branch Info */}
                       <div className="lg:w-1/3 bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full overflow-y-auto">
                            <div className="mb-6">
                                <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full uppercase mb-2 ${getStatusColor(selectedBranch.status)}`}>
                                    {selectedBranch.status === 'open' ? 'Actuellement Ouvert' : selectedBranch.status === 'busy' ? 'Très Achalandé' : 'Fermé'}
                                </span>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedBranch.name}</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectedBranch.address}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Équipe</p>
                                    <p className="font-bold text-slate-800">{selectedBranch.manager}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Téléphone</p>
                                    <p className="font-bold text-slate-800">{selectedBranch.phone}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Heures d'ouverture</p>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between"><span>Lun-Ven</span> <span className="font-bold">09:00 - 21:00</span></div>
                                        <div className="flex justify-between"><span>Sam-Dim</span> <span className="font-bold">10:00 - 17:00</span></div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4" /> Appeler la succursale
                            </button>
                       </div>

                       {/* Right Content: Branch Inventory */}
                       <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="font-bold text-lg flex items-center gap-2">
                                   <Package className="w-5 h-5 text-slate-600" /> Inventaire Local
                               </h3>
                               <div className="relative w-64">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrer l'inventaire..." 
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                        value={inventorySearch}
                                        onChange={(e) => setInventorySearch(e.target.value)}
                                    />
                               </div>
                           </div>

                           <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 flex-1 content-start">
                               {filteredInventory.map((item) => (
                                   <div key={item.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow relative group bg-white">
                                       <div className="h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                                           <ShoppingBag className="w-8 h-8 text-gray-300" />
                                       </div>
                                       <div className="mb-2">
                                           <h4 className="font-bold text-sm text-slate-800 line-clamp-2 min-h-[2.5em] leading-tight" title={item.name}>{item.name}</h4>
                                           <p className="text-[10px] text-gray-400 font-mono mt-1">Code: {item.id}</p>
                                       </div>
                                       <div className="flex justify-between items-center mt-auto">
                                           <span className="font-bold text-slate-900">{item.price.toFixed(2)}$</span>
                                           <button className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <Plus className="w-4 h-4" />
                                           </button>
                                       </div>
                                   </div>
                               ))}
                               {filteredInventory.length === 0 && (
                                   <div className="col-span-full text-center py-10 text-gray-400 italic">
                                       Aucun produit trouvé dans cette succursale.
                                   </div>
                               )}
                           </div>

                           <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500 bg-orange-50 p-3 rounded-xl border border-orange-100">
                               <AlertCircle className="w-4 h-4 text-orange-500" />
                               <span>Les stocks de cette succursale sont synchronisés toutes les 15 minutes.</span>
                           </div>
                       </div>
                   </div>
               )}
           </div>
        </div>
    );
};
