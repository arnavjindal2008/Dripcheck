"use client";

import { memo } from "react";
import { ClothingItem } from "./ClothingCard";
import { isOnePiece } from "@/lib/clothingUtils";

type MannequinProps = {
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
};

// ---------------------------------------------------------------------------
// SMART LAYERING SYSTEM
// ---------------------------------------------------------------------------

function getLayer(item: ClothingItem): string {
  if (!item) return "z-20";

  const haystack = [item.name ?? "", item.category ?? "", item.type ?? ""]
    .join(" ")
    .toLowerCase();

  const outerwearKeywords = ["jacket", "coat", "hoodie", "blazer", "cardigan", "puffer"];
  const innerwearKeywords = ["inner", "base", "underwear", "vest", "tee"];

  if (outerwearKeywords.some((kw) => haystack.includes(kw))) {
    return "z-30";
  }

  if (innerwearKeywords.some((kw) => haystack.includes(kw))) {
    return "z-10";
  }

  return "z-20";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Mannequin = ({ top, bottom, shoes }: MannequinProps) => {
  const isOP = isOnePiece(top);

  return (
    <div className="relative aspect-[3/4] w-full max-w-sm mx-auto flex justify-center rounded-2xl overflow-hidden shadow-inner bg-muted/10 group transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">

      {/* BASE MODEL */}
      {/* BASE MODEL REMOVED */}

      {/* ONE-PIECE GARMENT */}
      {top && isOP && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={top.image_url}
          alt={`One-piece: ${top.name}`}
          onError={(e) => { e.currentTarget.style.display = "none" }}
          className={`absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-2xl transition-all duration-500 hover:scale-105 z-20`}
          style={{
            top: "8%",
            height: "75%",
            width: "70%",
          }}
        />
      )}

      {/* TOP GARMENT (Standard) */}
      {top && !isOP && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={top.image_url}
          alt={`Top: ${top.name}`}
          onError={(e) => { e.currentTarget.style.display = "none" }}
          className={`absolute left-1/2 -translate-x-1/2 object-contain object-bottom drop-shadow-2xl transition-all duration-500 hover:scale-105 ${getLayer(top)}`}
          style={{
            top: "8%",
            height: "38%",
            width: "70%",
          }}
        />
      )}

      {/* BOTTOM GARMENT */}
      {bottom && !isOP && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bottom.image_url}
          alt={`Bottom: ${bottom.name}`}
          onError={(e) => { e.currentTarget.style.display = "none" }}
          className={`absolute left-1/2 -translate-x-1/2 object-contain object-top drop-shadow-2xl transition-all duration-500 hover:scale-105 ${getLayer(bottom)}`}
          style={{
            top: "44%",
            height: "45%",
            width: "60%",
          }}
        />
      )}


      {/* SHOES */}
      {shoes && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shoes.image_url}
          alt={`Shoes: ${shoes.name}`}
          onError={(e) => { e.currentTarget.style.display = "none" }}
          className={`absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-xl transition-all duration-500 hover:scale-110 ${getLayer(shoes)}`}
          style={{
            bottom: "6%",
            height: "12%",
            width: "45%",
          }}
        />
      )}

      {!top && !bottom && !shoes && (
        <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none z-40">
          <span className="text-xs text-muted-foreground/50 font-medium">
            Outfit preview
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(Mannequin);
