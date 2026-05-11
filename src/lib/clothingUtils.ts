export type ClothingItemLite = {
  type: string;
  name?: string;
  category?: string;
};

/**
 * Returns the "rendering" group for an item.
 * Used to determine how to draw the item on the mannequin/avatar.
 */
export const getRenderingGroup = (item?: ClothingItemLite): "top" | "bottom" | "one-piece" | "shoes" | "other" => {
  if (!item) return "other";
  
  const lowType = (item.type || "").toLowerCase().trim();
  const lowName = (item.name || "").toLowerCase().trim();
  const lowCat = (item.category || "").toLowerCase().trim();
  
  // More aggressive haystack to catch one-pieces in any field
  const haystack = `${lowType} ${lowName} ${lowCat}`.replace(/-/g, ' ');

  // One-piece check (priority)
  if (
    lowType === "one-piece" || 
    lowType === "one piece" ||
    lowCat === "one-piece" ||
    lowCat === "one piece" ||
    [
      "dress", "jumpsuit", "romper", "overall", "gown", "bodysuit", "unitard", "playsuit", "overalls",
      "maxi dress", "mini dress", "bodycon", "sundress", "co-ord"
    ].some(k => haystack.includes(k)) ||
    (haystack.includes("suit") && !haystack.includes("jacket"))
  ) {
    return "one-piece";
  }
  
  // Shoes check
  if (
    lowType === "shoes" ||
    ["shoe", "sneaker", "boot", "heel", "sandal", "footwear", "loafer", "flat", "trainer"].some(k => haystack.includes(k))
  ) {
    return "shoes";
  }

  // Top check
  if (
    lowType === "top" ||
    [
      "shirt", "hoodie", "jacket", "tee", "sweater", "blouse", "coat", "tank", "jersey", "t-shirt", "cardigan", "vest", "sweatshirt",
      "henley", "polo", "top", "pullover", "zip-up", "blazer", "shacket", "kurta", "sherwani", "nehru", "pathani", "kurti", "turtleneck", "mock neck"
    ].some(k => haystack.includes(k))
  ) {
    return "top";
  }

  // Bottom check
  if (
    lowType === "bottom" ||
    [
      "pant", "jean", "short", "skirt", "trouser", "legging", "jogger", "denim", "cargo", "chino", "sweatpant", "tracksuit", "parachute",
      "corduroy", "bermuda", "salwar", "palazzo", "lehenga", "dhoti", "churidar", "patiala", "sharara"
    ].some(k => haystack.includes(k))
  ) {
    return "bottom";
  }

  return "other";
};

/**
 * Returns the "logical" type for filtering and display.
 * If it's a standard type, returns the standard name.
 * If it's a custom type, returns the custom name.
 */
export const getLogicalGroup = (item?: ClothingItemLite): string => {
  if (!item) return "other";
  const renderGroup = getRenderingGroup(item);
  if (renderGroup !== "other") return renderGroup;
  return (item.type || "other").toLowerCase().trim();
};

export const isOnePiece = (item?: ClothingItemLite) => getRenderingGroup(item) === "one-piece";
export const isTop = (item?: ClothingItemLite) => getRenderingGroup(item) === "top";
export const isBottom = (item?: ClothingItemLite) => getRenderingGroup(item) === "bottom";
export const isShoes = (item?: ClothingItemLite) => getRenderingGroup(item) === "shoes";
