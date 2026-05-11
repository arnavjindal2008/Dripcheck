"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X, Upload, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { processImage } from "@/lib/imagePipeline";
import { useUIStore } from "@/lib/store";
import { CLOTHING_TYPES, CLOTHING_COLORS, CLOTHING_OCCASIONS } from "@/lib/clothingVocab";

const MAX_FILE_SIZE_MB = 10;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setLoading, toast } = useUIStore();
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [isCustomType, setIsCustomType] = useState(false);
  const [color, setColor] = useState("");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [category, setCategory] = useState("casual");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [weather, setWeather] = useState<string[]>(["all", "summer", "winter", "rainy", "spring"]);
  const [shouldRemoveBg, setShouldRemoveBg] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast(`File is too large (${(selected.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE_MB} MB.`, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleWeather = (id: string) => {
    setWeather(prev => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter(w => w !== id && w !== "all");
      } else {
        next = [...prev.filter(w => w !== "all"), id];
      }
      const seasons = ['summer', 'winter', 'rainy', 'spring'];
      if (seasons.every(s => next.includes(s))) return ["all", ...seasons];
      return next.length === 0 ? ["all"] : next;
    });
  };

  const setAllWeather = () => {
    if (weather.includes("all")) {
      setWeather([]);
    } else {
      setWeather(["all", "summer", "winter", "rainy", "spring"]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!name || !type || !color || !category) {
      toast("Please fill out all fields.", "error");
      return;
    }

    const weatherString = weather.includes("all") ? "all" : weather.join(',');
    const success = await processImage(file, name, category, type, color, weatherString, shouldRemoveBg, setLoading, toast);

    if (success) {
      router.push("/dashboard/wardrobe");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">Add to Wardrobe</h1>
        <p className="text-text-muted mt-2 font-medium">Upload a photo to expand your collection.</p>
      </div>

      <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {!preview ? (
          <div
            className={`flex flex-col items-center justify-center p-8 sm:p-20 border-2 border-dashed rounded-[1.5rem] sm:rounded-[2rem] transition-all cursor-pointer ${isDragging ? "border-white bg-text-primary/10 scale-[1.02]" : "border-border-color bg-background/40 hover:border-white/30"
              }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg"><Camera className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg"><ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" /></div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-text-primary text-center">Tap to Upload</p>
            <p className="text-xs sm:text-sm text-text-muted text-center mt-3 font-medium px-4">JPEG, PNG — High quality photos work best</p>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>
        ) : (
          <div className="relative w-full aspect-square sm:aspect-video bg-background/40 rounded-[2rem] overflow-hidden flex items-center justify-center border border-border-color shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]" />
            <button onClick={handleRemoveImage} className="absolute top-6 right-6 bg-background/60 backdrop-blur-md border border-border-color/20 text-text-primary w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-background transition-all active:scale-90"><X className="w-6 h-6" /></button>
          </div>
        )}

        {preview && (
          <form onSubmit={handleSave} className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3 sm:col-span-2">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Name / Title</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vintage Denim Jacket" className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium" required />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Type</label>
                {!isCustomType ? (
                  <select value={type} onChange={(e) => { if (e.target.value === "custom") { setIsCustomType(true); setType(""); } else { setType(e.target.value); } }} className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary appearance-none font-medium cursor-pointer" required>
                    <option value="" disabled>Select Type...</option>
                    <option value="top">Top</option><option value="bottom">Bottom</option><option value="one-piece">One-piece</option><option value="shoes">Shoes</option><option value="custom">Other / Custom...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input 
                      type="text" 
                      list="clothing-types"
                      value={type} 
                      onChange={(e) => setType(e.target.value)} 
                      placeholder="Type custom category..." 
                      className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary font-medium" 
                      autoFocus 
                      required 
                    />
                    <datalist id="clothing-types">
                      {CLOTHING_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomType(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Color</label>
                {!isCustomColor ? (
                  <select value={color} onChange={(e) => { if (e.target.value === "custom") { setIsCustomColor(true); setColor(""); } else { setColor(e.target.value); } }} className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary appearance-none font-medium cursor-pointer" required>
                    <option value="" disabled>Select Color...</option>
                    <option value="black">Black</option><option value="white">White</option><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="custom">Other / Custom...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input 
                      type="text" 
                      list="clothing-colors"
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      placeholder="Type custom color..." 
                      className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary font-medium" 
                      autoFocus 
                      required 
                    />
                    <datalist id="clothing-colors">
                      {CLOTHING_COLORS.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomColor(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 bg-text-primary/5 rounded-3xl border border-border-color sm:col-span-2">
                <div className="space-y-1">
                  <p className="text-text-primary font-bold">Remove Background</p>
                  <p className="text-text-muted text-xs font-medium">Use AI to isolate the item</p>
                </div>
                <button type="button" onClick={() => setShouldRemoveBg(!shouldRemoveBg)} className={`w-14 h-8 rounded-full transition-all relative border border-border-color ${shouldRemoveBg ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-text-primary/5'}`}>
                  <div className={`absolute top-1 w-6 h-6 rounded-full transition-all shadow-md ${shouldRemoveBg ? 'left-7 bg-background' : 'left-1 bg-text-primary/20'}`} />
                </button>
              </div>

              <div className="space-y-4 sm:col-span-2 pt-4 border-t border-white/5">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Occasion / Category</label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { label: 'Any Occasion', value: 'all' },
                    { label: 'Casual', value: 'casual' },
                    { label: 'Formal', value: 'formal' },
                    { label: 'Party', value: 'party' },
                    { label: 'Streetwear', value: 'streetwear' },
                    { label: 'Athletic', value: 'athletic' }
                  ].map(cat => (
                    <button key={cat.value} type="button" onClick={() => { setCategory(cat.value); setIsCustomCategory(false); }} className={`px-4 sm:px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${category === cat.value && !isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                      {cat.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setIsCustomCategory(true); setCategory(""); }} className={`px-4 sm:px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                    Other...
                  </button>
                </div>
                {isCustomCategory && (
                  <div className="relative mt-4 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      list="clothing-occasions"
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      placeholder="Type custom occasion (e.g. Wedding, Gym)..." 
                      className="w-full bg-background/50 border border-border-color rounded-2xl py-4 px-6 text-text-primary font-medium focus:outline-none focus:border-white/30" 
                      autoFocus 
                      required 
                    />
                    <datalist id="clothing-occasions">
                      {CLOTHING_OCCASIONS.map(o => <option key={o} value={o} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="space-y-4 sm:col-span-2 pt-4 border-t border-white/5">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Seasons</label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                  <button type="button" onClick={setAllWeather} className={`px-4 sm:px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${weather.includes('all') ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                    {weather.includes('all') && <Check className="w-3 h-3 sm:w-4 sm:h-4" />} All Weather
                  </button>
                  {['Summer', 'Winter', 'Rainy', 'Spring'].map(w => (
                    <button key={w} type="button" onClick={() => toggleWeather(w.toLowerCase())} className={`px-4 sm:px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${weather.includes(w.toLowerCase()) ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                      {weather.includes(w.toLowerCase()) && <Check className="w-3 h-3 sm:w-4 sm:h-4" />} {w === 'Spring' ? 'Spring/Fall' : w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={!type || !color || !category} className="w-full rounded-[1.5rem] px-4 py-5 bg-text-primary text-background font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-text-primary/90 active:scale-95 transition-all disabled:opacity-30 shadow-2xl mt-10">
              <Upload className="w-5 h-5" /> Save to Wardrobe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
