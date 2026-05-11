"use client";

import { MoreVertical, Trash2, Edit2, Shirt, WashingMachine, X, Loader2, Check, ChevronDown } from "lucide-react";
import { useState, useTransition, useEffect, useRef, type ElementType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { markAsLaundry, deleteItem, markAsAvailable, editItem } from "@/app/actions/wardrobe";
import { useUIStore } from "@/lib/store";
import { CLOTHING_TYPES, CLOTHING_COLORS, CLOTHING_OCCASIONS } from "@/lib/clothingVocab";

export type ClothingItem = {
  id: string;
  name: string;
  image_url: string;
  type: string;
  color: string;
  category: string;
  weather: string;
  status: "available" | "laundry";
  created_at?: string;
};

const ActionButton = ({ icon: Icon, label, onClick, variant = "default" }: { icon: ElementType, label: string, onClick: () => void, variant?: "default" | "danger" }) => (
  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-bold transition-all rounded-2xl hover:bg-text-primary/10 active:scale-[0.97] ${variant === "danger" ? "text-red-400" : "text-text-primary/80 hover:text-text-primary"}`}>
    <Icon className="w-5 h-5 shrink-0" /> {label}
  </button>
);

export default function ClothingCard({ 
  item, 
  onDelete, 
  onStatusChange,
  isSelected,
  isSelectionMode,
  onSelect
}: { 
  item: ClothingItem, 
  onDelete?: (id: string) => void, 
  onStatusChange?: (id: string, newStatus: "available" | "laundry") => void,
  isSelected?: boolean,
  isSelectionMode?: boolean,
  onSelect?: (id: string) => void
}) {
  const router = useRouter();
  const { toast } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState(item.name || "");
  const [editType, setEditType] = useState(item.type || "");
  const [isCustomType, setIsCustomType] = useState(item.type ? !["top", "bottom", "one-piece", "shoes"].includes(item.type.toLowerCase()) : false);
  const [editColor, setEditColor] = useState(item.color || "");
  const [isCustomColor, setIsCustomColor] = useState(item.color ? !["black", "white", "blue", "red", "green"].includes(item.color.toLowerCase()) : false);
  const [editCategory, setEditCategory] = useState(item.category || "casual");
  const [isCustomCategory, setIsCustomCategory] = useState(item.category ? !["all", "casual", "formal", "party", "streetwear", "athletic"].includes(item.category.toLowerCase()) : false);
  
  const SEASONS = [
    { id: 'summer', label: 'Summer' },
    { id: 'winter', label: 'Winter' },
    { id: 'rainy', label: 'Rainy' },
    { id: 'spring', label: 'Spring/Fall' }
  ];

  const initialWeather = item.weather ? item.weather.split(',').map(w => w.trim()) : ["all"];
  const [editWeather, setEditWeather] = useState<string[]>(initialWeather);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleWeather = (id: string) => {
    setEditWeather(prev => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter(w => w !== id && w !== "all");
      } else {
        next = [...prev.filter(w => w !== "all"), id];
      }
      const seasons = SEASONS.map(s => s.id);
      if (seasons.every(s => next.includes(s))) return ["all", ...seasons];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const setAllWeather = () => {
    if (editWeather.includes("all")) {
      setEditWeather([]);
    } else {
      setEditWeather(["all", "summer", "winter", "rainy", "spring"]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; 
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLaundry = () => {
    if (item.status === "laundry") return;
    onStatusChange?.(item.id, 'laundry');
    startTransition(async () => {
      try {
        await markAsLaundry(item.id);
        router.refresh();
      } catch (error) { toast("Error moving to laundry", "error"); }
    });
  };

  const handleMoveToWardrobe = () => {
    if (item.status === "available") return;
    onStatusChange?.(item.id, 'available');
    startTransition(async () => {
      try {
        await markAsAvailable(item.id);
        router.refresh();
      } catch (error) { toast("Error moving to wardrobe", "error"); }
    });
  };

  const handleDelete = () => {
    onDelete?.(item.id);
    startTransition(async () => {
      try {
        await deleteItem(item.id);
        router.refresh();
      } catch (error) { toast("Error deleting item", "error"); }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const weatherToSave = editWeather.includes("all") ? "all" : editWeather.join(',');
        await editItem(item.id, {
          name: editName,
          type: editType,
          color: editColor,
          category: editCategory,
          weather: weatherToSave
        });
        toast("Updated successfully", "success");
        setIsEditing(false);
        router.refresh();
      } catch (error) { toast("Error updating item", "error"); }
    });
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-[0.98]' : ''}`}
      onClick={() => isSelectionMode && onSelect?.(item.id)}
    >
      <div className={`relative bg-text-primary/5 backdrop-blur-xl border rounded-[2.5rem] flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-border-color/20 group-hover:-translate-y-1 ${showMenu ? "z-50 shadow-2xl" : "z-10"} ${isSelected ? 'border-white/40 bg-text-primary/10 shadow-2xl' : 'border-border-color'}`}>
        {!isSelectionMode && (
          <div className="absolute top-4 right-4 z-40" ref={menuRef}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${showMenu ? "bg-text-primary text-background" : "bg-background/60 text-text-primary/80 hover:bg-white hover:text-black"}`}>
              <MoreVertical className="w-6 h-6" />
            </button>
            {showMenu && (
              <div className="hidden md:block absolute top-12 right-0 w-56 bg-background-secondary/95 backdrop-blur-2xl border border-border-color/20 rounded-[1.8rem] shadow-custom p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                <ActionButton icon={Edit2} label="Edit Details" onClick={() => { setShowMenu(false); setIsEditing(true); }} />
                {item.status === 'available' ? (
                  <ActionButton icon={WashingMachine} label="Move to Laundry" onClick={() => { handleLaundry(); setShowMenu(false); }} />
                ) : (
                  <ActionButton icon={Shirt} label="Back to Wardrobe" onClick={() => { handleMoveToWardrobe(); setShowMenu(false); }} />
                )}
                <div className="h-px bg-text-primary/5 my-2 mx-2" />
                <ActionButton icon={Trash2} label="Delete Item" onClick={() => { setShowDeleteConfirm(item.id); setShowMenu(false); }} variant="danger" />
              </div>
            )}
          </div>
        )}

        {isSelectionMode && (
          <div className="absolute top-4 right-4 z-40">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-white border-white' : 'bg-background/40 border-border-color/20'}`}>
              {isSelected && <Check className="w-5 h-5 text-black" />}
            </div>
          </div>
        )}

        <div className="aspect-[4/5] relative flex items-center justify-center p-4 sm:p-8 overflow-hidden rounded-t-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent shrink-0 group/img">
          <div className="absolute inset-0 bg-white/[0.02] animate-pulse group-hover/img:bg-white/[0.05] transition-colors duration-700" />
          <img 
            src={item.image_url} 
            alt={item.name} 
            loading="lazy"
            className={`w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out z-10 ${isSelected ? 'scale-90' : 'group-hover:scale-110 group-hover:rotate-2'}`} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        <div className="p-4 sm:p-6 flex flex-col justify-between h-[110px] sm:h-[130px] border-t border-white/5 bg-white/[0.01]">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xs sm:text-sm font-black text-text-primary/90 uppercase tracking-tight flex-1 leading-tight line-clamp-2">
                {item.name || `${item.color} ${item.type}`}
              </h3>
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black border uppercase tracking-widest leading-none shrink-0 ${item.status === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                {item.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
            <span className="px-2 sm:px-3 py-1 bg-text-primary/5 border border-border-color text-text-muted text-[8px] sm:text-[9px] font-black rounded-lg uppercase tracking-wider whitespace-nowrap">
              {item.category === 'all' ? 'Any' : item.category}
            </span>
            <span className="px-2 sm:px-3 py-1 bg-text-primary/5 border border-border-color text-text-muted text-[8px] sm:text-[9px] font-black rounded-lg uppercase tracking-wider whitespace-nowrap">
              {(!item.weather || item.weather === 'all') ? 'All' : (item.weather.includes(',') ? 'Multi' : item.weather)}
            </span>
          </div>
        </div>
      </div>

      {showMenu && typeof document !== "undefined" && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex items-end justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-sm bg-background-secondary border border-border-color rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-500 ease-out" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-text-primary/10 rounded-full mx-auto mb-8" />
            <h4 className="text-text-muted text-[9px] font-black uppercase tracking-[0.2em] text-center mb-6">Quick Actions</h4>
            <div className="space-y-2.5 sm:space-y-3">
              <button 
                onClick={() => { setShowMenu(false); setIsEditing(true); }}
                className="w-full flex items-center justify-between px-6 py-5 bg-text-primary/5 rounded-3xl border border-white/5 active:scale-95 transition-all text-text-primary font-bold"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-text-primary/5 flex items-center justify-center"><Edit2 className="w-5 h-5 text-text-primary/60" /></div>
                  <span className="text-sm">Edit Details</span>
                </div>
              </button>

              {item.status === 'available' ? (
                <button 
                  onClick={() => { handleLaundry(); setShowMenu(false); }}
                  className="w-full flex items-center justify-between px-6 py-5 bg-text-primary/5 rounded-3xl border border-white/5 active:scale-95 transition-all text-text-primary font-bold"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center"><WashingMachine className="w-5 h-5 text-blue-400" /></div>
                    <span className="text-sm">Move to Laundry</span>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => { handleMoveToWardrobe(); setShowMenu(false); }}
                  className="w-full flex items-center justify-between px-6 py-5 bg-text-primary/5 rounded-3xl border border-white/5 active:scale-95 transition-all text-text-primary font-bold"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center"><Shirt className="w-5 h-5 text-green-400" /></div>
                    <span className="text-sm">Back to Wardrobe</span>
                  </div>
                </button>
              )}

              <div className="h-px bg-text-primary/5 my-2" />

              <button 
                onClick={() => { setShowDeleteConfirm(item.id); setShowMenu(false); }}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-red-500/10 rounded-[1.5rem] sm:rounded-3xl border border-red-500/10 active:scale-95 transition-all text-red-400 font-bold"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center"><Trash2 className="w-5 h-5" /></div>
                  <span className="text-sm">Delete Item</span>
                </div>
              </button>

              <button 
                onClick={() => setShowMenu(false)}
                className="w-full py-5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all mt-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {showDeleteConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-xl p-6 animate-in fade-in zoom-in-95 duration-300" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-card-background border border-border-color rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20"><Trash2 className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tighter">Remove Item?</h3>
            <p className="text-text-muted mb-10 text-lg font-medium leading-relaxed">This action cannot be undone. Remove from wardrobe?</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => { handleDelete(); setShowDeleteConfirm(null); }} className="w-full bg-red-500 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 shadow-2xl active:scale-95 transition-all">Remove from wardrobe</button>
              <button onClick={() => setShowDeleteConfirm(null)} className="w-full bg-text-primary/5 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 active:scale-95 transition-all border border-white/5">Cancel</button>
            </div>
          </div>
        </div>, document.body
      )}

      {isEditing && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-background/95 backdrop-blur-2xl p-0 sm:p-6 animate-in fade-in duration-300" onClick={() => setIsEditing(false)}>
          <div className="bg-background-secondary border-t sm:border border-border-color rounded-t-[3.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 w-full max-w-xl shadow-2xl relative h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto pb-24 sm:pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="sm:hidden w-16 h-1.5 bg-text-primary/10 rounded-full mx-auto mb-8" />
            <button onClick={() => setIsEditing(false)} className="hidden sm:flex absolute top-8 right-8 w-12 h-12 items-center justify-center rounded-2xl bg-text-primary/5 hover:bg-text-primary/10 text-text-muted hover:text-text-primary transition-all active:scale-90"><X className="w-6 h-6" /></button>
            
            <div className="flex items-center justify-between mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-4xl font-black text-text-primary uppercase tracking-tighter leading-none">Edit Item</h2>
              <button onClick={() => setIsEditing(false)} className="sm:hidden px-3 py-1.5 rounded-lg bg-text-primary/5 text-text-muted text-[9px] font-black uppercase tracking-widest">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <label className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 sm:ml-2 block">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-background/50 border border-border-color rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-4 sm:py-6 text-text-primary text-base sm:text-lg focus:outline-none focus:border-white/40 transition-all font-bold shadow-inner" required />
              </div>

              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 sm:ml-2 block">Category</label>
                  {!isCustomType ? (
                    <div className="relative group/sel">
                      <select value={editType} onChange={(e) => { if (e.target.value === "custom") { setIsCustomType(true); setEditType(""); } else { setEditType(e.target.value); } }} className="w-full bg-white/[0.03] border border-border-color rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5 text-text-primary appearance-none font-bold cursor-pointer hover:bg-text-primary/5 transition-all text-sm sm:text-base" required>
                        <option value="top">Top</option><option value="bottom">Bottom</option><option value="one-piece">One-piece</option><option value="shoes">Shoes</option><option value="custom">Custom...</option>
                      </select>
                      <ChevronDown className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover/sel:text-text-primary/60 transition-colors" />
                    </div>
                  ) : (
                    <div className="relative animate-in zoom-in-95 duration-300">
                      <input 
                        type="text" 
                        list="edit-clothing-types"
                        value={editType} 
                        onChange={(e) => setEditType(e.target.value)} 
                        placeholder="Type..." 
                        className="w-full bg-white/[0.03] border border-border-color/20 rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5 text-text-primary font-bold focus:outline-none focus:border-white/40 text-sm sm:text-base" 
                        autoFocus 
                        required 
                      />
                      <datalist id="edit-clothing-types">
                        {CLOTHING_TYPES.map(t => <option key={t} value={t} />)}
                      </datalist>
                      <button type="button" onClick={() => setIsCustomType(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 sm:ml-2 block">Color</label>
                  {!isCustomColor ? (
                    <div className="relative group/sel">
                      <select value={editColor} onChange={(e) => { if (e.target.value === "custom") { setIsCustomColor(true); setEditColor(""); } else { setEditColor(e.target.value); } }} className="w-full bg-white/[0.03] border border-border-color rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5 text-text-primary appearance-none font-bold cursor-pointer hover:bg-text-primary/5 transition-all text-sm sm:text-base" required>
                        <option value="black">Black</option><option value="white">White</option><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="custom">Other...</option>
                      </select>
                      <ChevronDown className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover/sel:text-text-primary/60 transition-colors" />
                    </div>
                  ) : (
                    <div className="relative animate-in zoom-in-95 duration-300">
                      <input 
                        type="text" 
                        list="edit-clothing-colors"
                        value={editColor} 
                        onChange={(e) => setEditColor(e.target.value)} 
                        placeholder="Color..." 
                        className="w-full bg-white/[0.03] border border-border-color/20 rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5 text-text-primary font-bold focus:outline-none focus:border-white/40 text-sm sm:text-base" 
                        autoFocus 
                        required 
                      />
                      <datalist id="edit-clothing-colors">
                        {CLOTHING_COLORS.map(c => <option key={c} value={c} />)}
                      </datalist>
                      <button type="button" onClick={() => setIsCustomColor(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 sm:ml-2 block">Occasion</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Any', value: 'all' },
                    { label: 'Casual', value: 'casual' },
                    { label: 'Formal', value: 'formal' },
                    { label: 'Party', value: 'party' },
                    { label: 'Street', value: 'streetwear' },
                    { label: 'Gym', value: 'athletic' }
                  ].map(cat => (
                    <button key={cat.value} type="button" onClick={() => { setEditCategory(cat.value); setIsCustomCategory(false); }} className={`py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${editCategory === cat.value && !isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-white/[0.03] text-text-muted border-white/5 hover:border-border-color/20'}`}>
                      {cat.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setIsCustomCategory(true); setEditCategory(""); }} className={`py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-white/[0.03] text-text-muted border-white/5 hover:border-border-color/20'}`}>
                    Custom
                  </button>
                </div>
                {isCustomCategory && (
                  <div className="relative mt-4 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      list="edit-clothing-occasions"
                      value={editCategory} 
                      onChange={(e) => setEditCategory(e.target.value)} 
                      placeholder="Type custom occasion..." 
                      className="w-full bg-white/[0.03] border border-border-color/20 rounded-3xl px-8 py-6 text-text-primary text-lg font-bold focus:outline-none focus:border-white/40 shadow-inner" 
                      autoFocus 
                      required 
                    />
                    <datalist id="edit-clothing-occasions">
                      {CLOTHING_OCCASIONS.map(o => <option key={o} value={o} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 sm:ml-2 block">Seasons</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button type="button" onClick={setAllWeather} className={`col-span-2 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 sm:gap-3 ${editWeather.includes('all') ? 'bg-text-primary text-background border-white shadow-xl scale-[1.02]' : 'bg-white/[0.03] text-text-muted border-white/5 hover:border-border-color/20'}`}>
                    {editWeather.includes('all') && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} All Seasons
                  </button>
                  {SEASONS.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleWeather(s.id)} className={`py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 sm:gap-3 ${editWeather.includes(s.id) ? 'bg-text-primary text-background border-white shadow-xl scale-[1.02]' : 'bg-white/[0.03] text-text-muted border-white/5 hover:border-border-color/20'}`}>
                      {editWeather.includes(s.id) && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isPending} className="w-full bg-text-primary text-background font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] py-7 mt-12 shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all disabled:opacity-30">
                {isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
