"use client";

import { useState, useMemo } from "react";
import ClothingCard, { ClothingItem } from "@/components/ClothingCard";
import { Filter, Search, CloudSun, Calendar, Shirt, Trash2, WashingMachine, X, MousePointer2, Loader2 } from "lucide-react";
import FilterDropdown from "@/components/FilterDropdown";
import { bulkUpdateStatus, bulkDeleteItems } from "@/app/actions/wardrobe";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store";
import { getLogicalGroup } from "@/lib/clothingUtils";

export default function WardrobeClient({ initialClothes }: { initialClothes: ClothingItem[] }) {
  const [clothes, setClothes] = useState(initialClothes);
  const [prevInitialClothes, setPrevInitialClothes] = useState(initialClothes);

  if (initialClothes !== prevInitialClothes) {
    setClothes(initialClothes);
    setPrevInitialClothes(initialClothes);
  }

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeWeather, setActiveWeather] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useUIStore();

  const dynamicTypeOptions = useMemo(() => {
    const types = new Set(clothes.map(c => getLogicalGroup(c)));
    const standardOrder = ["top", "one-piece", "bottom", "shoes"];
    
    const presentStandard = standardOrder.filter(t => types.has(t));
    const presentCustom = Array.from(types).filter(t => !standardOrder.includes(t) && t !== "other").sort();
    
    const finalOrder = ["all", ...presentStandard, ...presentCustom];
    
    return finalOrder.map(t => ({
      value: t,
      label: t === "all" ? "All Types" : t.split(/[- ]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }));
  }, [clothes]);

  const dynamicCategoryOptions = useMemo(() => {
    const cats = new Set(clothes.map(c => c.category?.toLowerCase() || "all"));
    const standardOrder = ["casual", "formal", "party", "streetwear", "athletic"];

    const presentStandard = standardOrder.filter(c => cats.has(c));
    const presentCustom = Array.from(cats).filter(c => !standardOrder.includes(c) && c !== "all").sort();

    const finalOrder = ["all", ...presentStandard, ...presentCustom];

    return finalOrder.map(c => ({
      value: c,
      label: c === "all" ? "Any Occasion" : c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }));
  }, [clothes]);

  const dynamicWeatherOptions = useMemo(() => {
    const allWeathers = clothes.flatMap(c =>
      c.weather ? c.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"]
    );
    const uniqueWeathers = new Set(allWeathers);

    const standardOrder = ["summer", "winter", "rainy", "spring"];
    const presentStandard = standardOrder.filter(w => uniqueWeathers.has(w));
    const presentCustom = Array.from(uniqueWeathers).filter(w => !standardOrder.includes(w) && w !== "all").sort();

    const finalOrder = ["all", ...presentStandard, ...presentCustom];

    return finalOrder.map(w => ({
      value: w,
      label: w === "all" ? "All Weather" : (w === "spring" ? "Spring/Fall" : w.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '))
    }));
  }, [clothes]);

  const filteredClothes = useMemo(() => {
    return clothes.filter(item => {
      const itemGroup = getLogicalGroup(item);
      const matchesType = activeFilter === "all" || itemGroup === activeFilter.toLowerCase();
      
      const itemSeasons = item.weather ? item.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"];
      const matchesWeather = activeWeather === "all" || 
                             itemSeasons.includes("all") || 
                             itemSeasons.includes(activeWeather.toLowerCase());

      const itemCat = item.category?.toLowerCase() || "all";
      const matchesCategory = activeCategory === "all" || itemCat === activeCategory.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (item.name || "").toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q);
        
      return matchesType && matchesWeather && matchesCategory && matchesSearch;
    });
  }, [clothes, activeFilter, activeWeather, activeCategory, searchQuery]);

  const handleDelete = (id: string) => {
    setClothes(prev => prev.filter(c => c.id !== id));
  };

  const handleStatusChange = (id: string, _newStatus: "available" | "laundry") => {
    setClothes(prev => prev.filter(c => c.id !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkLaundry = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await bulkUpdateStatus(ids, "laundry");
        setClothes(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        toast(`Moved ${ids.length} items to laundry`, "success");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to move items", "error");
      }
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await bulkDeleteItems(ids);
        setClothes(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setShowBulkDeleteConfirm(false);
        toast(`Successfully deleted ${ids.length} items`, "success");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to delete items", "error");
      }
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase tracking-tighter">My Wardrobe</h1>
              <p className="text-text-muted mt-1 sm:mt-2 font-medium text-sm sm:text-base">Your collection of style and drip.</p>
            </div>

            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds(new Set());
              }}
              className={`px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isSelectionMode ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-border-color/20'}`}
            >
              {isSelectionMode ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <MousePointer2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {isSelectionMode ? "Cancel" : "Select Items"}
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search clothes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 bg-text-primary/5 border border-border-color text-text-primary text-sm rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-11 sm:pl-12 pr-5 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-text-primary/20 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-40">
        <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 items-center gap-3 sm:gap-4 pb-2 sm:pb-0">
          <div className="shrink-0">
            <FilterDropdown
              label="Type"
              icon={<Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              value={activeFilter}
              onChange={setActiveFilter}
              options={dynamicTypeOptions}
            />
          </div>

          <div className="shrink-0">
            <FilterDropdown
              label="Season"
              icon={<CloudSun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              value={activeWeather}
              onChange={setActiveWeather}
              options={dynamicWeatherOptions}
            />
          </div>

          <div className="shrink-0">
            <FilterDropdown
              label="Occasion"
              icon={<Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              value={activeCategory}
              onChange={setActiveCategory}
              options={dynamicCategoryOptions}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
        {filteredClothes.map(item => (
          <ClothingCard
            key={item.id}
            item={item}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(item.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>

      {filteredClothes.length === 0 && (
        <div className="text-center py-24 sm:py-32 bg-white/[0.02] border border-border-color rounded-[3rem] shadow-2xl flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700">
          <div className="relative group">
            <div className="absolute -inset-4 bg-text-primary/5 rounded-full blur-2xl group-hover:bg-text-primary/10 transition-all duration-700" />
            <div className="relative w-20 h-20 rounded-3xl bg-text-primary/5 flex items-center justify-center text-text-primary/20 border border-border-color shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Shirt className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-text-primary text-2xl font-black tracking-tight">Style Not Found</p>
            <p className="text-text-muted text-sm font-medium max-w-[200px] mx-auto">No items match your current vibe. Try broadning your search.</p>
          </div>
          <button
            onClick={() => { setActiveFilter('all'); setActiveWeather('all'); setActiveCategory('all'); setSearchQuery(''); }}
            className="px-8 py-4 bg-text-primary text-background text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            Reset Filters
          </button>
        </div>
      )}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-lg animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-background-secondary/90 backdrop-blur-2xl border border-border-color/20 rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-4 shadow-custom flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col ml-3 sm:ml-4 shrink-0">
              <span className="text-text-primary font-black text-base sm:text-lg leading-none">{selectedIds.size}</span>
              <span className="text-text-muted text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkLaundry}
                disabled={isPending}
                className="bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <WashingMachine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden xs:inline">Laundry</span>
                <span className="xs:hidden">Move</span>
              </button>

              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isPending}
                className="bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95 duration-300" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="bg-card-background border border-border-color rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-3 tracking-tighter uppercase">Delete {selectedIds.size} Items?</h3>
            <p className="text-text-muted mb-10 text-lg font-medium leading-relaxed">This will permanently remove these items from your wardrobe. This action cannot be undone.</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="w-full bg-red-500 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isPending}
                className="w-full bg-text-primary/5 text-text-primary font-black text-xs uppercase tracking-[0.2em] rounded-2xl py-5 active:scale-95 transition-all border border-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
