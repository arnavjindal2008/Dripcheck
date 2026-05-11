"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Bookmark, Calendar, CloudSun, Wand2, Plus, X, ArrowLeftRight, Check, Trash2, History } from "lucide-react";
import FilterDropdown from "@/components/FilterDropdown";
import { ClothingItem } from "@/components/ClothingCard";
import AvatarCanvas from "@/components/AvatarCanvas";
import { getAvailableClothesForOutfits, saveOutfitAction } from "@/app/actions/outfits";
import { useUIStore } from "@/lib/store";
import { isTop, isBottom, isOnePiece, isShoes } from "@/lib/clothingUtils";

type Outfit = {
  id: string;
  top: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  saved?: boolean;
};

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [allClothes, setAllClothes] = useState<ClothingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeather, setSelectedWeather] = useState("all");
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const { setLoading, toast } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    const fetchClothes = async () => {
      const data = await getAvailableClothesForOutfits();
      setAllClothes(data);
    };
    fetchClothes();
  }, []);

  const dynamicCategoryOptions = useMemo(() => {
    const cats = new Set(allClothes.map(c => c.category?.toLowerCase() || "all"));
    const standardOrder = ["casual", "formal", "party", "streetwear", "athletic"];
    const presentStandard = standardOrder.filter(c => cats.has(c));
    const presentCustom = Array.from(cats).filter(c => !standardOrder.includes(c) && c !== "all").sort();
    const finalOrder = ["all", ...presentStandard, ...presentCustom];
    return finalOrder.map(c => ({
      value: c,
      label: c === "all" ? "Any Occasion" : c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }));
  }, [allClothes]);

  const dynamicWeatherOptions = useMemo(() => {
    const allWeathers = allClothes.flatMap(c =>
      c.weather ? c.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"]
    );
    const uniqueWeathers = new Set(allWeathers);
    const standardOrder = ["summer", "winter", "rainy", "spring"];
    const presentStandard = standardOrder.filter(w => uniqueWeathers.has(w));
    const presentCustom = Array.from(uniqueWeathers).filter(w => !standardOrder.includes(w) && w !== "all").sort();
    const finalOrder = ["all", ...presentStandard, ...presentCustom];
    return finalOrder.map(w => ({
      value: w,
      label: w === "all" ? "Any Weather" : (w === "spring" ? "Spring/Fall" : w.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '))
    }));
  }, [allClothes]);

  const INCOMPATIBLE_PAIRS: Array<[Set<string>, Set<string>]> = [
    [new Set(["formal"]), new Set(["athletic", "streetwear"])],
    [new Set(["athletic"]), new Set(["formal", "party"])],
  ];

  function isCompatibleCombo(topCat: string, bottomCat: string): boolean {
    const t = topCat.toLowerCase();
    const b = bottomCat.toLowerCase();

    // If either is "all", it's generally compatible unless we want strict rules
    if (t === "all" || b === "all") return true;

    for (const [groupA, groupB] of INCOMPATIBLE_PAIRS) {
      if ((groupA.has(t) && groupB.has(b)) || (groupB.has(t) && groupA.has(b))) {
        return false;
      }
    }
    return true;
  }

  const generateOutfits = async () => {
    try {
      const occasionLabel = selectedCategory === "all" ? "Any Occasion" : selectedCategory;
      setLoading(true, `Styling ${occasionLabel} outfits for ${selectedWeather} weather...`, "Styling Session");
      setOutfits([]);

      const availableClothes = allClothes.filter(c => c.status === "available");

      if (allClothes.length === 0) {
        toast("Add clothes to your wardrobe to generate outfits.", "info");
        setLoading(false);
        return;
      }

      if (availableClothes.length === 0) {
        toast("All your clothes are currently in laundry! Refresh them to style outfits.", "info");
        setLoading(false);
        return;
      }

      let clothes = [...availableClothes];

      // Filter by category and weather
      clothes = clothes.filter(item => {
        // Match category: if selected is all, OR item is tagged all, OR they match exactly
        const itemCat = item.category?.toLowerCase() || "all";
        const matchesCategory = selectedCategory === "all" ||
          itemCat === "all" ||
          itemCat === selectedCategory.toLowerCase();

        const itemSeasons = item.weather ? item.weather.split(',').map(w => w.trim().toLowerCase()) : ["all"];
        const matchesWeather = selectedWeather === "all" ||
          itemSeasons.includes("all") ||
          itemSeasons.includes(selectedWeather.toLowerCase());

        return matchesCategory && matchesWeather;
      });

      if (clothes.length === 0) {
        toast(`No available items found for the selected filters.`, "info");
        setLoading(false);
        return;
      }

      const onePiecesOnly = clothes.filter(c => isOnePiece(c));
      const everythingElse = clothes.filter(c => !isOnePiece(c));

      const tops = everythingElse.filter(c => isTop(c));
      const bottoms = everythingElse.filter(c => isBottom(c));
      const shoes = clothes.filter(c => isShoes(c)); // Use all clothes for shoes

      console.log("CLOTHING CLASSIFICATION DEBUG:");
      console.log("- One-pieces detected:", onePiecesOnly.length, onePiecesOnly.map(c => `[${c.type}] ${c.name}`));
      console.log("- Tops detected:", tops.length);
      console.log("- Bottoms detected:", bottoms.length);
      console.log("- Shoes detected:", shoes.length);

      if ((tops.length === 0 || bottoms.length === 0) && onePiecesOnly.length === 0) {
        toast("Not enough variety in wardrobe.", "info");
        setLoading(false);
        return;
      }

      const twoPieceGenerated: Outfit[] = [];
      const onePieceGenerated: Outfit[] = [];

      const isNeutral = (color: string) => {
        const c = (color || "").toLowerCase().trim();
        return c === "black" || c === "white" || c === "gray" || c === "grey" || c === "navy";
      };

      // 1. Combine Tops and Bottoms
      for (const t of tops) {
        for (const b of bottoms) {
          const tColor = (t.color || "").toLowerCase().trim();
          const bColor = (b.color || "").toLowerCase().trim();
          if (tColor === bColor && !isNeutral(tColor)) continue;
          if (!isCompatibleCombo(t.category ?? "", b.category ?? "")) continue;

          if (shoes.length > 0) {
            for (const s of shoes) {
              twoPieceGenerated.push({
                id: `outfit-${t.id}-${b.id}-${s.id}`,
                top: t,
                bottom: b,
                shoes: s
              });
            }
          } else {
            twoPieceGenerated.push({
              id: `outfit-${t.id}-${b.id}`,
              top: t,
              bottom: b
            });
          }
        }
      }

      // 2. Add One-Pieces
      for (const op of onePiecesOnly) {
        if (shoes.length > 0) {
          for (const s of shoes) {
            onePieceGenerated.push({
              id: `outfit-${op.id}-${s.id}`,
              top: op,
              shoes: s
            });
          }
        } else {
          onePieceGenerated.push({
            id: `outfit-${op.id}`,
            top: op
          });
        }
      }

      // Shuffle and slice each group separately
      const shuffledOnePiece = onePieceGenerated.sort(() => Math.random() - 0.5).slice(0, 15);
      const shuffledTwoPiece = twoPieceGenerated.sort(() => Math.random() - 0.5).slice(0, 25);

      // Maintain One-Piece outfits at the top of the list, followed by Two-Piece outfits
      const combinedResults = [...shuffledOnePiece, ...shuffledTwoPiece];

      setOutfits(combinedResults);

      if (combinedResults.length > 0) {
        toast("Outfits generated!", "success");
      } else {
        toast("No matches found.", "info");
      }

    } catch (err) {
      console.error(err);
      toast("Error generating outfits.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveOutfitToDB = async (outfit: Outfit) => {
    if (outfit.saved) return;
    try {
      await saveOutfitAction(outfit.top.id, outfit.bottom?.id, outfit.shoes?.id);

      setOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, saved: true } : o));
      toast("Outfit saved!", "success");
    } catch (err) {
      console.error(err);
      toast("Error saving outfit.", "error");
    }
  };

  const toggleComparison = (id: string) => {
    setSelectedForComparison(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const comparedOutfits = useMemo(() =>
    outfits.filter(o => selectedForComparison.includes(o.id)),
    [outfits, selectedForComparison]);



  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
        <div className="flex justify-between items-start w-full lg:w-auto">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Outfit Engine</h1>
            <p className="text-text-muted mt-2 font-medium text-base sm:text-lg">Select your vibe and let AI do the rest.</p>
          </div>
          <Link 
            href="/dashboard/history" 
            className="lg:hidden w-12 h-12 rounded-2xl bg-text-primary/5 border border-border-color flex items-center justify-center text-text-primary hover:bg-text-primary/10 transition-all active:scale-90"
            title="Saved Outfits"
          >
            <History className="w-6 h-6" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-40">
          <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 items-center gap-3 w-full sm:w-auto pb-2 sm:pb-0">
            <div className="shrink-0">
              <FilterDropdown
                label="Occasion"
                icon={<Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={dynamicCategoryOptions}
              />
            </div>

            <div className="shrink-0">
              <FilterDropdown
                label="Weather"
                icon={<CloudSun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                value={selectedWeather}
                onChange={setSelectedWeather}
                options={dynamicWeatherOptions}
              />
            </div>
          </div>

          <button
            onClick={generateOutfits}
            className="flex items-center justify-center gap-3 bg-text-primary text-background w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 group h-[48px] sm:h-[52px]"
          >
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Style Me
          </button>
        </div>
      </div>

      {outfits.length === 0 ? (
        <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2.5rem] text-center py-32 flex flex-col items-center justify-center shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary mb-8 border border-border-color shadow-lg">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-text-primary mb-3 tracking-tight">
            {allClothes.length === 0
              ? "Add clothes to your wardrobe"
              : allClothes.every(c => c.status === "laundry")
                ? "Clothes are in Laundry"
                : "Ready to get styled?"}
          </h3>
          <p className="text-text-muted max-w-sm font-medium text-lg leading-relaxed">
            {allClothes.length === 0
              ? "Your wardrobe is empty. Upload some clothes to start generating outfits!"
              : allClothes.every(c => c.status === "laundry")
                ? "All your clothes are currently being refreshed. Mark them as available in the Laundry module to use them here!"
                : "Select an occasion and weather above to create combinations from your collection!"}
          </p>
          {allClothes.length === 0 && (
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="mt-8 px-8 py-4 bg-text-primary text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Upload Clothes
            </button>
          )}
        </div>
      ) : isCompareMode ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCompareMode(false)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <X className="w-4 h-4" /> Exit Comparison
            </button>
            <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
              Comparing {comparedOutfits.length} Options
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-6 sm:gap-8 pb-8 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
            {comparedOutfits.map((outfit, index) => (
              <div key={outfit.id} className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 snap-center">
                <OutfitCard
                  outfit={outfit}
                  index={index}
                  onSave={saveOutfitToDB}
                  isSelectable
                  isSelected={true}
                  onToggleSelect={() => toggleComparison(outfit.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-6 sm:gap-8 pb-8 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
            {outfits.map((outfit, index) => (
              <div key={outfit.id} className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 snap-center">
                <OutfitCard
                  outfit={outfit}
                  index={index}
                  onSave={saveOutfitToDB}
                  isSelectable
                  isSelected={selectedForComparison.includes(outfit.id)}
                  onToggleSelect={() => toggleComparison(outfit.id)}
                />
              </div>
            ))}
          </div>

          {/* Floating Comparison Bar */}
          {selectedForComparison.length > 0 && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-2xl bg-text-primary text-background rounded-[2rem] sm:rounded-3xl p-3 sm:p-4 shadow-2xl z-[60] flex items-center justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 sm:gap-4 px-2 sm:px-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/10 flex items-center justify-center border border-white/5 shrink-0">
                  <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="font-black text-[8px] sm:text-[10px] uppercase tracking-widest leading-none">Pool</p>
                  <p className="text-[12px] sm:text-[14px] font-bold mt-0.5 sm:mt-1 opacity-70 whitespace-nowrap">{selectedForComparison.length} selected</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedForComparison([])}
                  className="p-2 sm:p-3 hover:bg-background/10 rounded-xl transition-all"
                  title="Clear Selection"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
                </button>
                <button
                  onClick={() => setIsCompareMode(true)}
                  disabled={selectedForComparison.length < 2}
                  className="bg-background text-text-primary px-4 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
                >
                  Compare
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OutfitCard({
  outfit,
  index,
  onSave,
  isSelectable,
  isSelected,
  onToggleSelect
}: {
  outfit: Outfit,
  index: number,
  onSave: (o: Outfit) => void,
  isSelectable?: boolean,
  isSelected?: boolean,
  onToggleSelect?: () => void
}) {
  const isOP = isOnePiece(outfit.top);

  return (
    <div className={`bg-text-primary/5 backdrop-blur-lg border rounded-[2.5rem] p-6 flex flex-col gap-6 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden ${isSelected ? 'border-text-primary ring-2 ring-text-primary/20 bg-text-primary/[0.08]' : 'border-border-color'}`}>
      <div className="flex justify-between items-start z-20">
        <div className="flex justify-center relative z-10">
          <span className="px-4 py-1.5 bg-text-primary/10 text-text-muted text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
            {isOP ? "FULL BODY" : "MIX & MATCH"} #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSelectable && (
            <button
              onClick={onToggleSelect}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group/compare relative ${isSelected 
                ? 'bg-text-primary text-background shadow-lg shadow-text-primary/20 ring-1 ring-white/20' 
                : 'bg-background/80 backdrop-blur-md text-text-muted hover:text-text-primary border border-border-color hover:border-text-primary/30 shadow-sm'}`}
              title={isSelected ? "Remove from comparison" : "Add to comparison"}
            >
              {isSelected ? (
                <Check className="w-5 h-5 animate-in zoom-in duration-300" />
              ) : (
                <ArrowLeftRight className="w-5 h-5 transition-transform group-hover/compare:scale-110" />
              )}
            </button>
          )}
          
          <button
            onClick={() => onSave(outfit)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${outfit.saved
              ? "bg-favorite text-white border-favorite shadow-favorite/20"
              : "bg-background/80 backdrop-blur-md text-text-muted hover:text-text-primary border border-border-color"
              }`}
          >
            <Bookmark className="w-5 h-5" fill={outfit.saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <AvatarCanvas top={outfit.top} bottom={outfit.bottom} shoes={outfit.shoes} />
      </div>

      <div className="relative z-10 text-center p-5 sm:p-6 border-t border-white/5 bg-white/[0.01] -mx-6 -mb-6 mt-auto h-[100px] sm:h-[120px] flex flex-col justify-center">
        <p className="font-black text-text-primary/90 uppercase tracking-wider text-[10px] sm:text-xs leading-tight line-clamp-2">
          {outfit.top.name || outfit.top.type}
        </p>
        <div className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2 flex flex-col gap-1 w-full">
          {outfit.bottom && <span className="line-clamp-1 opacity-60">+ {outfit.bottom.name || outfit.bottom.type}</span>}
          {outfit.shoes && <span className="line-clamp-1 opacity-60">+ {outfit.shoes.name || outfit.shoes.type}</span>}
        </div>
      </div>
    </div>
  );
}
