
import React, { useState, useEffect } from 'react';
import { SHOP_ITEMS, ShopItem, UserType } from '../types';
import { buyItem, getInventory } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { AvatarFrame } from './AvatarFrame';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  currentScore: number;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, currentUser, currentScore }) => {
  const { complaints, refreshData, avatars } = useComplaints();
  const [activeTab, setActiveTab] = useState<'frame' | 'medal'>('frame');
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Sync Inventory on open
  useEffect(() => {
    if (isOpen) {
        setOwnedItems(getInventory(complaints, currentUser));
    }
  }, [isOpen, complaints, currentUser]);

  const handleBuy = async (item: ShopItem) => {
      // Logic Check
      if (currentScore < item.price) {
          alert(`Не хватает ${item.price - currentScore} баллов!`);
          return;
      }

      setBuyingId(item.id);

      try {
        console.log("Attempting purchase:", item.id);
        const success = await buyItem(currentUser, item);
        
        if (success) {
            console.log("Purchase success, refreshing data...");
            await refreshData();
            setOwnedItems(prev => [...prev, item.id]);
            // Auto-equip frames upon purchase
            if (item.type === 'frame') {
                localStorage.setItem(`equipped_frame_${currentUser}`, item.id);
                window.dispatchEvent(new Event('storage'));
            }
            alert(`Успешно куплено: ${item.name}`);
        } else {
            alert("Ошибка при сохранении покупки. Попробуйте еще раз.");
        }
      } catch (e) {
        console.error("Buy error:", e);
        alert("Критическая ошибка магазина.");
      } finally {
        setBuyingId(null);
      }
  };

  const handleEquip = (item: ShopItem) => {
      if (item.type === 'frame') {
          localStorage.setItem(`equipped_frame_${currentUser}`, item.id);
          window.dispatchEvent(new Event('storage'));
          setPreviewId(item.id); // Update preview
      }
  };

  const handleUnequip = () => {
      localStorage.removeItem(`equipped_frame_${currentUser}`);
      window.dispatchEvent(new Event('storage'));
      setPreviewId(null);
  };

  if (!isOpen) return null;

  const filteredItems = SHOP_ITEMS.filter(i => i.type === activeTab);
  const currentEquippedId = localStorage.getItem(`equipped_frame_${currentUser}`);
  const userAvatar = avatars[currentUser];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="w-full max-w-sm h-[85vh] glass-panel flex flex-col relative animate-scaleIn overflow-hidden shadow-2xl border border-white/20 bg-[#1a1b26]/90 text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 font-display tracking-wide">
                    МАГАЗИН
                </h2>
                <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-yellow-500 text-sm">monetization_on</span>
                    <span className="text-yellow-500 font-bold text-lg">{currentScore}</span>
                </div>
            </div>
            <button onClick={onClose} className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>

        {/* Live Preview (Only for Frames) */}
        {activeTab === 'frame' && (
            <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 to-transparent relative">
                <AvatarFrame 
                    frameId={previewId || currentEquippedId} 
                    src={userAvatar} 
                    size="xl" 
                />
                <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-bold">Предпросмотр</p>
            </div>
        )}

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-black/40">
            <button 
                onClick={() => setActiveTab('frame')}
                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'frame' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50' : 'text-gray-500 hover:bg-white/5'}`}
            >
                Оправы
            </button>
            <button 
                onClick={() => setActiveTab('medal')}
                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'medal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50' : 'text-gray-500 hover:bg-white/5'}`}
            >
                Медали
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {activeTab === 'frame' && (
                <button onClick={handleUnequip} className="w-full p-3 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors mb-2">
                    <span className="material-symbols-outlined text-sm">block</span> Снять все
                </button>
            )}

            {filteredItems.map(item => {
                const isOwned = ownedItems.includes(item.id) || item.price === 0;
                const isEquipped = currentEquippedId === item.id;
                const rarityColor = item.rarity === 'legendary' ? 'text-yellow-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400';

                return (
                    <div 
                        key={item.id} 
                        onClick={() => item.type === 'frame' && setPreviewId(item.id)}
                        className={`p-3 rounded-2xl border transition-all relative overflow-hidden group
                            ${isEquipped ? 'bg-indigo-900/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:border-white/30'}
                        `}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            {/* Icon / Mini Preview */}
                            <div className="size-14 shrink-0 flex items-center justify-center bg-black/30 rounded-xl relative overflow-hidden">
                                {item.type === 'frame' ? (
                                    <AvatarFrame frameId={item.id} src={userAvatar} size="sm" />
                                ) : (
                                    <span className="text-2xl">{item.icon}</span>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-sm ${item.rarity === 'legendary' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
                                        {item.name}
                                    </h4>
                                    {isOwned && <span className="material-symbols-outlined text-green-500 text-sm">check</span>}
                                </div>
                                <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                                <p className={`text-[10px] font-bold uppercase mt-1 ${rarityColor}`}>{item.rarity || 'Common'}</p>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0 min-w-[70px]">
                                {isOwned ? (
                                    item.type === 'frame' ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEquip(item); }}
                                            disabled={isEquipped}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all
                                                ${isEquipped ? 'bg-gray-700 text-gray-400 cursor-default' : 'bg-green-600 text-white shadow-lg shadow-green-600/40 hover:scale-105'}
                                            `}
                                        >
                                            {isEquipped ? 'Надето' : 'Надеть'}
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-center text-gray-500 font-bold uppercase">Куплено</span>
                                    )
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleBuy(item); }}
                                        disabled={buyingId !== null}
                                        className="w-full py-2 rounded-lg bg-white text-black text-[10px] font-bold uppercase shadow-lg hover:bg-gray-200 active:scale-95 transition-transform"
                                    >
                                        {buyingId === item.id ? '...' : `${item.price} pts`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
