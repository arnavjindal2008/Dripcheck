"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sparkles, Heart, Loader2, Trash2, LayoutGrid, List as ListIcon, Shirt, CloudSun, Calendar } from "lucide-react";
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
          <h1 className="text-4xl font-black tracking-tight text-text-primary">Saved Outfits</h1>
          <p className="text-text-muted mt-2 font-medium text-lg">Your curated collection of styles.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-text-primary/5 backdrop-blur-xl border border-border-color p-6 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row gap-6 items-center lg:items-end relative z-40">
        <div className="flex flex-wrap items-center gap-4 flex-1 w-full lg:w-auto">
          {/* Favorite Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 flex items-center gap-1">
              <Heart className="w-3 h-3" /> View
            </label>
            <div className="flex p-1 bg-background/40 rounded-2xl border border-white/5">
              {(["all", "favorites"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-text-primary text-background shadow-lg' : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Filter */}
          <FilterDropdown
            label="Weather"
            icon={<CloudSun className="w-3.5 h-3.5" />}
            value={selectedWeather}
            onChange={setSelectedWeather}
            options={dynamicWeatherOptions}
          />

          {/* Category/Occasion Filter */}
          <FilterDropdown
            label="Occasion"
            icon={<Calendar className="w-3.5 h-3.5" />}
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={dynamicCategoryOptions}
          />
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-background/40 border border-border-color p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setViewType("grid")}
            className={`p-3 rounded-xl transition-all ${viewType === "grid" ? "bg-text-primary text-background shadow-lg" : "text-text-muted hover:text-text-primary"}`}
            title="Grid View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewType("list")}
            className={`p-3 rounded-xl transition-all ${viewType === "list" ? "bg-text-primary text-background shadow-lg" : "text-text-muted hover:text-text-primary"}`}
            title="List View"
          >
            <ListIcon className="w-5 h-5" />
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
            <div className={viewType === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 fade-in animate-in fade-in duration-500" : "flex flex-col gap-6 fade-in animate-in fade-in duration-500"}>
              {filteredOutfits.map((outfit) => {
                const isOP = isOnePiece(outfit.top);
                const isComplete = outfit.top && (isOP || outfit.bottom);

                if (viewType === "list") {
                  return (
                    <div key={outfit.id} className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-3xl p-5 flex items-center justify-between group hover:shadow-2xl transition-all duration-300">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-background/40 rounded-2xl overflow-hidden p-2 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                          {outfit.top && <img src={outfit.top.image_url} alt="Top" className="w-full h-full object-contain filter drop-shadow-lg" />}
                        </div>
                        <div>
                          <span className="px-3 py-1 bg-text-primary/10 text-text-muted text-[10px] font-black uppercase tracking-widest rounded-full mb-2 inline-block">
                            {new Date(outfit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div className="text-sm font-bold text-text-primary/90 line-clamp-2 max-w-[150px] sm:max-w-none">
                            {isComplete
                              ? (isOP ? outfit.top?.name : `${outfit.top?.name} + ${outfit.bottom?.name}`)
                              : "Incomplete Outfit"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${outfit.favorite
                              ? "bg-favorite text-white border-favorite shadow-[0_0_20px_rgba(255,45,85,0.4)]"
                              : "bg-text-primary/5 text-text-muted hover:text-favorite hover:bg-favorite/10 border-border-color"
                            }`}
                        >
                          <Heart className="w-5 h-5" fill={outfit.favorite ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(outfit.id)}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-text-primary/5 text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-border-color active:scale-90"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Grid View
                return (
                  <div key={outfit.id} className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2.5rem] p-6 flex flex-col gap-6 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <div className="flex justify-between items-center z-10">
                      <span className="px-4 py-1.5 bg-text-primary/10 text-text-muted text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
                        {new Date(outfit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${outfit.favorite
                              ? "bg-favorite text-white border-favorite shadow-[0_0_20px_rgba(255,45,85,0.4)]"
                              : "bg-text-primary/5 text-text-muted hover:text-favorite hover:bg-favorite/10 border-border-color"
                            }`}
                        >
                          <Heart className="w-5 h-5" fill={outfit.favorite ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(outfit.id)}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-text-primary/5 text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-border-color active:scale-90"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {!isComplete ? (
                      <div className="flex flex-col items-center justify-center gap-4 bg-background/40 rounded-[2rem] p-8 min-h-[350px] text-text-primary/20 border border-white/5 shadow-inner">
                        <Shirt className="w-12 h-12 opacity-10" />
                        <p className="font-bold text-xs uppercase tracking-widest">Items Archived</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative z-10">
                          <AvatarCanvas top={outfit.top} bottom={outfit.bottom} shoes={outfit.shoes} />
                        </div>

                        <div className="relative z-10 text-center p-5 sm:p-6 border-t border-white/5 bg-white/[0.01] -mx-6 -mb-6 mt-auto h-[100px] sm:h-[120px] flex flex-col justify-center">
                          <p className="font-black text-text-primary/90 uppercase tracking-wider text-[10px] sm:text-xs leading-tight line-clamp-2">
                            {outfit.top?.name}
                          </p>
                          <div className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2 flex flex-col gap-1 w-full">
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
          <div className="bg-card-background border border-border-color rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-lg">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-text-primary mb-3">Delete Look?</h3>
            <p className="text-text-muted mb-10 text-lg font-medium leading-relaxed">This memory will be cleared from your archive.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-text-primary/10 text-text-primary font-black text-xs uppercase tracking-widest rounded-2xl py-4 hover:bg-text-primary/20 transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOutfit(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-text-primary font-black text-xs uppercase tracking-widest rounded-2xl py-4 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
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
