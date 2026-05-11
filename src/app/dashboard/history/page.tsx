"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Heart, Trash2, LayoutGrid, List as ListIcon, Calendar, CloudSun, Loader2, Shirt, SlidersHorizontal, Sparkles } from "lucide-react";
import FilterDropdown from "@/components/FilterDropdown";
import { ClothingItem } from "@/components/ClothingCard";
import AvatarCanvas from "@/components/AvatarCanvas";
import { getHistoryOutfits, toggleFavoriteAction, deleteOutfitAction } from "@/app/actions/outfits";
import { isOnePiece } from "@/lib/clothingUtils";

type SavedOutfit = {
  id: string;
  created_at: string;
  favorite: boolean;
  top_id: string;
  bottom_id: string | null;
  shoes_id: string | null;
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
};

export default function HistoryPage() {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [selectedWeather, setSelectedWeather] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const dynamicCategoryOptions = useMemo(() => {
    const cats = new Set(savedOutfits.map(o => o.top?.category?.toLowerCase() || "all"));
    const standardOrder = ["casual", "formal", "party", "streetwear", "athletic"];
    const presentStandard = standardOrder.filter(c => cats.has(c));
    const presentCustom = Array.from(cats).filter(c => !standardOrder.includes(c) && c !== "all").sort();
    const finalOrder = ["all", ...presentStandard, ...presentCustom];
    return finalOrder.map(c => ({
      value: c,
      label: c === "all" ? "Any Occasion" : c.charAt(0).toUpperCase() + c.slice(1)
    }));
  }, [savedOutfits]);

  const dynamicWeatherOptions = useMemo(() => {
    const allWeathers = savedOutfits.flatMap(o => {
      const items = [o.top, o.bottom, o.shoes].filter(Boolean) as ClothingItem[];
      return items.flatMap(item => item.weather ? item.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"]);
    });
    const uniqueWeathers = new Set(allWeathers);
    const standardOrder = ["summer", "winter", "rainy", "spring"];
    const presentStandard = standardOrder.filter(w => uniqueWeathers.has(w));
    const presentCustom = Array.from(uniqueWeathers).filter(w => !standardOrder.includes(w) && w !== "all").sort();
    const finalOrder = ["all", ...presentStandard, ...presentCustom];
    return finalOrder.map(w => ({
      value: w,
      label: w === "all" ? "Any Weather" : (w === "spring" ? "Spring/Fall" : w.charAt(0).toUpperCase() + w.slice(1))
    }));
  }, [savedOutfits]);

  const fetchHistory = useCallback(async () => {
    try {
      const reconstructed = await getHistoryOutfits();
      setSavedOutfits(reconstructed as SavedOutfit[]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load saved outfits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleFavorite = async (id: string, currentFav: boolean) => {
    try {
      await toggleFavoriteAction(id, currentFav);
      setSavedOutfits(prev => prev.map(o =>
        o.id === id ? { ...o, favorite: !currentFav } : o
      ));
    } catch (err) {
      console.error(err);
      setError("Failed to update favorite status.");
    }
  };

  const deleteOutfit = async (id: string) => {
    try {
      await deleteOutfitAction(id);
      setSavedOutfits(prev => prev.filter(o => o.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete outfit.");
    }
  };

  const filteredOutfits = savedOutfits.filter(o => {
    // 1. Favorite filter
    if (filter === "favorites" && !o.favorite) return false;

    const items = [o.top, o.bottom, o.shoes].filter(Boolean) as ClothingItem[];

    // 2. Weather filter (An outfit matches if ALL its pieces are compatible)
    if (selectedWeather !== "all") {
      const allPiecesMatch = items.every(item => {
        const itemSeasons = item.weather ? item.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"];
        return itemSeasons.includes("all") || itemSeasons.includes(selectedWeather.toLowerCase());
      });
      if (!allPiecesMatch) return false;
    }

    // 3. Category/Occasion filter (Based on the top's category)
    if (selectedCategory !== "all" && o.top) {
      const topCat = o.top.category?.toLowerCase() || "all";
      const matchesCategory = topCat === "all" || topCat === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;
    }

    return true;
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Saved Outfits</h1>
          <p className="text-text-muted mt-2 font-medium text-base sm:text-lg">Your curated collection of styles.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-text-primary/5 backdrop-blur-xl border border-border-color/20 p-3 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch lg:items-end relative z-40">
        
        {/* Mobile Top Row: Filters & View Switcher */}
        <div className="flex lg:hidden items-center justify-between gap-3">
          <div className="flex p-1 bg-background/40 rounded-2xl border border-white/5 h-[48px] flex-1">
            {(["all", "favorites"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-text-primary text-background shadow-lg' : 'text-text-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-background/40 border border-white/5 p-1 rounded-2xl h-[48px]">
            <button
              onClick={() => setViewType("grid")}
              className={`h-full px-4 rounded-xl transition-all flex items-center justify-center ${viewType === "grid" ? "bg-text-primary text-background shadow-lg" : "text-text-muted"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType("list")}
              className={`h-full px-4 rounded-xl transition-all flex items-center justify-center ${viewType === "list" ? "bg-text-primary text-background shadow-lg" : "text-text-muted"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Row (Desktop remains same, Mobile is scrollable row) */}
        <div className="flex overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 items-end gap-3 flex-1 pb-1 lg:pb-0">
          {/* Desktop-only Favorite Toggle */}
          <div className="hidden lg:flex flex-col gap-2.5 shrink-0">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" /> FILTER
            </label>
            <div className="flex p-1.5 bg-background/40 rounded-2xl border border-white/5 h-[52px] items-center">
              {(["all", "favorites"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 sm:px-6 h-full rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-text-primary text-background shadow-lg scale-[1.02]' : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-white/5 shrink-0 mb-1.5 hidden lg:block" />

          {/* Weather Filter */}
          <div className="shrink-0">
            <div className="lg:hidden mb-1.5 ml-2">
              <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Weather</label>
            </div>
            <FilterDropdown
              label="Weather"
              icon={<CloudSun className="w-3.5 h-3.5" />}
              value={selectedWeather}
              onChange={setSelectedWeather}
              options={dynamicWeatherOptions}
            />
          </div>

          {/* Category/Occasion Filter */}
          <div className="shrink-0">
            <div className="lg:hidden mb-1.5 ml-2">
              <label className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Occasion</label>
            </div>
            <FilterDropdown
              label="Occasion"
              icon={<Calendar className="w-3.5 h-3.5" />}
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={dynamicCategoryOptions}
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-10 bg-white/5 mb-1.5" />

        {/* Desktop-only View Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-background/40 border border-border-color p-1.5 rounded-2xl shrink-0 h-[52px]">
          <button
            onClick={() => setViewType("grid")}
            className={`h-full px-4 rounded-xl transition-all flex items-center justify-center ${viewType === "grid" ? "bg-text-primary text-background shadow-lg" : "text-text-muted hover:text-text-primary"}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setViewType("list")}
            className={`h-full px-4 rounded-xl transition-all flex items-center justify-center ${viewType === "list" ? "bg-text-primary text-background shadow-lg" : "text-text-muted hover:text-text-primary"}`}
            title="List View"
          >
            <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium fade-in animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-text-primary animate-spin mb-6" />
          <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Accessing Archives...</p>
        </div>
      ) : (
        <>
          {filteredOutfits.length === 0 ? (
            <div className="text-center py-32 bg-text-primary/5 border border-border-color rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl fade-in animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary mb-8 border border-border-color shadow-lg">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary mb-3">No Looks Found</h3>
              <p className="text-text-muted max-w-sm font-medium text-lg leading-relaxed">
                {savedOutfits.length === 0
                  ? "Start generating outfits to build your history."
                  : "Try adjusting your filters to find your saved styles."}
              </p>
            </div>
          ) : (
            <div className={
              viewType === "grid"
                ? "flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory pb-6 sm:pb-0"
                : "flex flex-col gap-4 sm:gap-6 fade-in animate-in fade-in duration-500"
            }>
              {filteredOutfits.map((outfit) => {
                const isOP = isOnePiece(outfit.top);
                const isComplete = outfit.top && (isOP || outfit.bottom);

                if (viewType === "list") {
                  return (
                    <div key={outfit.id} className="group relative bg-text-primary/[0.03] hover:bg-text-primary/[0.08] backdrop-blur-xl border border-border-color/10 hover:border-white/20 rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 flex items-center justify-between transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-0.5">
                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* Full Look Thumbnail */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-background/60 rounded-xl sm:rounded-[1.5rem] overflow-hidden flex items-center justify-center shrink-0 border border-white/5 shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-50" />
                          <div className="scale-[0.55] sm:scale-[0.65] origin-center translate-y-1 w-[120px]">
                            <AvatarCanvas top={outfit.top} bottom={outfit.bottom} shoes={outfit.shoes} minimal={true} />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-text-primary/10 text-text-muted text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] rounded-lg">
                              {new Date(outfit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {outfit.favorite && (
                              <div className="flex items-center gap-1.5 text-favorite">
                                <Heart className="w-3 h-3" fill="currentColor" />
                                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Favorite</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-xs sm:text-lg font-black text-text-primary tracking-tight uppercase tracking-tighter leading-none group-hover:text-white transition-colors">
                            {isOP ? outfit.top?.name : (outfit.top?.name + (outfit.bottom ? ` + ${outfit.bottom.name}` : ""))}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[7px] sm:text-[9px] font-bold text-text-muted/60 uppercase tracking-widest flex items-center gap-1.5">
                              <Shirt className="w-2.5 h-2.5" /> {outfit.top?.type}
                            </span>
                            {outfit.bottom && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[7px] sm:text-[9px] font-bold text-text-muted/60 uppercase tracking-widest flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 border-2 border-current rounded-sm opacity-50" /> {outfit.bottom.type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:gap-3 mr-1 sm:mr-2">
                        <button
                          onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${outfit.favorite
                              ? "bg-favorite text-white border-favorite shadow-[0_0_20px_rgba(255,45,85,0.4)]"
                              : "bg-background/40 text-text-muted hover:text-favorite hover:bg-favorite/10 border-white/5"
                            }`}
                        >
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5" fill={outfit.favorite ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(outfit.id)}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-background/40 text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-white/5 active:scale-90"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Grid View
                return (
                  <div key={outfit.id} className="shrink-0 w-[85vw] sm:w-auto snap-center bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <div className="flex justify-between items-center z-10">
                      <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-text-primary/10 text-text-muted text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
                        {new Date(outfit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex gap-2 sm:gap-3">
                        <button
                          onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${outfit.favorite
                            ? "bg-favorite text-white border-favorite shadow-[0_0_20px_rgba(255,45,85,0.4)]"
                            : "bg-text-primary/5 text-text-muted hover:text-favorite hover:bg-favorite/10 border-border-color"
                            }`}
                        >
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5" fill={outfit.favorite ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(outfit.id)}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-text-primary/5 text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-border-color active:scale-90"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {!isComplete ? (
                      <div className="flex flex-col items-center justify-center gap-4 bg-background/40 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 min-h-[300px] sm:min-h-[350px] text-text-primary/20 border border-white/5 shadow-inner">
                        <Shirt className="w-10 h-10 sm:w-12 sm:h-12 opacity-10" />
                        <p className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">Items Archived</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative z-10 scale-90 sm:scale-100 flex-1 flex items-center justify-center min-h-[300px] sm:min-h-0">
                          <AvatarCanvas top={outfit.top} bottom={outfit.bottom} shoes={outfit.shoes} />
                        </div>

                        {/* Mobile Items Swipe */}
                        <div className="sm:hidden -mx-4 px-4 py-4 bg-background/20 border-t border-white/5">
                          <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 ml-1">Pieces in Look</p>
                          <div className="flex overflow-x-auto gap-3 no-scrollbar snap-x snap-mandatory">
                            {[outfit.top, outfit.bottom, outfit.shoes].filter(Boolean).map((item, idx) => (
                              <div key={`${outfit.id}-item-${idx}`} className="shrink-0 w-32 snap-center bg-white/[0.03] border border-white/5 rounded-2xl p-2 flex flex-col gap-2">
                                <div className="aspect-square bg-background/40 rounded-xl overflow-hidden p-1.5">
                                  <img src={item!.image_url} alt={item!.name} className="w-full h-full object-contain filter drop-shadow-lg" />
                                </div>
                                <div className="px-1">
                                  <p className="text-[7px] font-black text-text-primary/90 uppercase truncate">{item!.name}</p>
                                  <p className="text-[6px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{item!.type}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="relative z-10 text-center p-4 sm:p-6 border-t border-white/5 bg-white/[0.01] -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-auto h-[80px] sm:h-[120px] flex flex-col justify-center">
                          <p className="font-black text-text-primary/90 uppercase tracking-wider text-[9px] sm:text-xs leading-tight line-clamp-2">
                            {outfit.top?.name}
                          </p>
                          <div className="text-[7px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 sm:mt-2 flex flex-col gap-0.5 sm:gap-1 w-full">
                            {outfit.bottom && <span className="line-clamp-1 opacity-60">+ {outfit.bottom.name}</span>}
                            {outfit.shoes && <span className="line-clamp-1 opacity-60">+ {outfit.shoes.name}</span>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-card-background border border-border-color rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-lg">
              <Trash2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-text-primary mb-2 sm:mb-3 uppercase tracking-tight">Delete Look?</h3>
            <p className="text-text-muted mb-8 sm:mb-10 text-base sm:text-lg font-medium leading-relaxed px-2">This style will be cleared from your archive.</p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-text-primary/10 text-text-primary font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl py-3.5 sm:py-4 hover:bg-text-primary/20 transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOutfit(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl py-3.5 sm:py-4 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
