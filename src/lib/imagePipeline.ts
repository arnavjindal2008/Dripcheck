import { processBackgroundRemoval } from "@/app/actions/removeBg";
import { uploadClothingItem } from "@/app/actions/upload";

export async function processImage(
  file: File,
  name: string,
  category: string,
  type: string,
  color: string,
  weather: string,
  removeBg: boolean,
  setLoading: (val: boolean, message?: string, title?: string) => void,
  toast: (msg: string, type?: "success" | "error" | "info") => void
): Promise<boolean> {
  try {
    setLoading(true, "Preparing studio...", "Studio Mode");
    let finalFile = file;

    if (removeBg) {
      setLoading(true, "Removing background...", "AI Studio");
      const formData = new FormData();
      formData.append('image_file', file);
      formData.append('size', 'auto');

      const { success, base64, type: blobType, error: bgError } = await processBackgroundRemoval(formData);

      if (success && base64) {
        const byteString = atob(base64);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const int8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          int8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([int8Array], { type: blobType });
        finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".png", { type: "image/png" });
      } else {
        console.warn("BG Removal error:", bgError);
        toast("Background removal failed, uploading original.", "info");
      }
    }

    // 2. Autocrop and Compress result
    finalFile = await processFinalImage(finalFile);

    setLoading(true, "Uploading to wardrobe...", "Studio Mode");

    // 3. Upload to Supabase (also inserts into clothes table)
    await uploadClothingItem(finalFile, name, category, type, color, weather);

    toast("Clothing item saved successfully!", "success");
    return true;

  } catch (error) {
    console.error(error);
    toast(error instanceof Error ? error.message : "Failed to process image.", "error");
    return false;
  } finally {
    setLoading(false);
  }
}

async function processFinalImage(file: File): Promise<File> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // 1. Initial Draw to get data
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // 2. Find Content Bounds (Autocrop)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 10) { // Threshold for "visible" pixels
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  // 3. Resize and Draw Cropped
  const maxWidth = 1024;
  // Add a tiny bit of padding (2%)
  const rawCropWidth = found ? (maxX - minX + 1) : img.width;
  const rawCropHeight = found ? (maxY - minY + 1) : img.height;
  const paddingX = found ? Math.round(rawCropWidth * 0.02) : 0;
  const paddingY = found ? Math.round(rawCropHeight * 0.02) : 0;

  const sourceX = found ? Math.max(0, minX - paddingX) : 0;
  const sourceY = found ? Math.max(0, minY - paddingY) : 0;
  const cropWidth = found ? Math.min(img.width - sourceX, rawCropWidth + paddingX * 2) : img.width;
  const cropHeight = found ? Math.min(img.height - sourceY, rawCropHeight + paddingY * 2) : img.height;

  const scale = cropWidth > maxWidth ? maxWidth / cropWidth : 1;
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    sourceX, sourceY, cropWidth, cropHeight,
    0, 0, canvas.width, canvas.height
  );

  const sourceIsPng = file.type === "image/png" || file.type === "image/webp" || file.type === "";
  let hasTransparency = false;

  if (sourceIsPng) {
    const { data: finalData } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < finalData.length; i += 4) {
      if (finalData[i] < 250) { // Check for transparency
        hasTransparency = true;
        break;
      }
    }
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");

  return new Promise((resolve) => {
    if (hasTransparency) {
      canvas.toBlob((blob) => {
        resolve(blob ? new File([blob], `${baseName}.png`, { type: "image/png" }) : file);
      }, "image/png");
    } else {
      canvas.toBlob((blob) => {
        resolve(blob ? new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }) : file);
      }, "image/jpeg", 0.85);
    }
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
