"use client";

import { memo } from "react";
import { ClothingItem } from "./ClothingCard";
import { isOnePiece } from "@/lib/clothingUtils";

type AvatarProps = {
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  minimal?: boolean;
};

// LAYERING ENGINE
function getLayer(item?: ClothingItem): string {
  if (!item) return "z-20";

  const haystack = [item.name ?? "", item.category ?? "", item.type ?? ""]
    .join(" ")
    .toLowerCase();

  const outerwearKeywords = ["jacket", "coat", "hoodie", "blazer", "cardigan", "puffer", "outer"];
  const innerwearKeywords = ["inner", "base", "underwear", "vest", "tee"];

  if (outerwearKeywords.some((kw) => haystack.includes(kw))) {
    return "z-30"; // outer
  }

  if (innerwearKeywords.some((kw) => haystack.includes(kw))) {
    return "z-10"; // inner
  }

  return "z-20"; // main
}

const AvatarCanvas = ({ top, bottom, shoes, minimal = false }: AvatarProps) => {
  const isOP = isOnePiece(top);

  return (
    <div className={`relative w-full aspect-[3/4] flex items-center justify-center transition-all duration-300 ${
      minimal ? "" : "bg-text-primary/5 border border-border-color rounded-2xl shadow-inner overflow-hidden group"
    }`}>

      {/* Silhouette Removed */}

      {/* ONE-PIECE GARMENT */}
      {top && isOP && (
        <div className={`absolute top-[10%] left-[15%] right-[15%] h-[75%] flex items-center justify-center transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-4 z-20`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top.image_url}
            alt={`One-piece: ${top.name}`}
            onError={(e) => { e.currentTarget.style.display = "none" }}
            className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      {/* BOTTOM GARMENT */}
      {bottom && !isOP && (
        <div className={`absolute top-[48%] left-[20%] right-[20%] h-[45%] flex items-start justify-center transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${getLayer(bottom)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bottom.image_url}
            alt={`Bottom: ${bottom.name}`}
            onError={(e) => { e.currentTarget.style.display = "none" }}
            className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      {/* TOP GARMENT (Standard) */}
      {top && !isOP && (
        <div className={`absolute top-[10%] left-[15%] right-[15%] h-[42%] flex items-end justify-center transition-all duration-700 animate-in fade-in slide-in-from-top-4 ${getLayer(top)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top.image_url}
            alt={`Top: ${top.name}`}
            onError={(e) => { e.currentTarget.style.display = "none" }}
            className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform"
          />
        </div>
      )}


      {/* SHOES */}
      {shoes && (
        <div className={`absolute bottom-[5%] left-[30%] right-[30%] h-[12%] flex items-center justify-center transition-all duration-700 animate-in fade-in zoom-in ${getLayer(shoes)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shoes.image_url}
            alt={`Shoes: ${shoes.name}`}
            onError={(e) => { e.currentTarget.style.display = "none" }}
            className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform"
          />
        </div>
      )}

      {!top && !bottom && !shoes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <span className="text-sm text-text-muted font-medium bg-background/50 px-4 py-2 rounded-full backdrop-blur-md">
            Avatar Canvas Empty
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(AvatarCanvas);
