"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, X, Upload, Check, RotateCw, Settings, Sparkles, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { processImage } from "@/lib/imagePipeline";
import { useUIStore } from "@/lib/store";
import { CLOTHING_TYPES, CLOTHING_COLORS, CLOTHING_OCCASIONS } from "@/lib/clothingVocab";

const MAX_FILE_SIZE_MB = 10;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<PermissionState | "unsupported">("prompt");
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

  // Check camera permission
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((result) => {
          setCameraPermission(result.state);
          // If already granted, ensure capture is set for Android/Mobile
          if (result.state === "granted") {
            fileInputRef.current?.setAttribute("capture", "environment");
          }
          result.onchange = () => {
            setCameraPermission(result.state);
            if (result.state === "granted") {
              fileInputRef.current?.setAttribute("capture", "environment");
            } else {
              fileInputRef.current?.removeAttribute("capture");
            }
          };
        })
        .catch(() => setCameraPermission("unsupported"));
    }
  }, []);

  const handleRequestCamera = async () => {
    try {
      // Use environment facing mode to avoid front camera flip on Android
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Stop all tracks and clear stream reference to fully release hardware
      stream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      
      setCameraPermission("granted");
      
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute("capture", "environment");
        // Tiny delay to ensure Android releases the camera hardware from getUserMedia
        // before the file input tries to claim it.
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 150);
      }
    } catch (err) {
      console.error("Camera request error:", err);
      setCameraPermission("denied");
      toast("Camera access denied. Please enable it in your browser settings.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast(`File is too large (${(selected.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE_MB} MB.`, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
    setRotation(0);
    setPreview(URL.createObjectURL(selected));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
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
    setRotation(0);
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
    const success = await processImage(file, name, category, type, color, weatherString, shouldRemoveBg, setLoading, toast, rotation);

    if (success) {
      router.push("/dashboard/wardrobe");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Add to Wardrobe</h1>
        <p className="text-text-muted mt-2 font-medium text-sm sm:text-lg">Upload a photo to expand your collection.</p>
      </div>

      <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {!preview ? (
          <div className="space-y-6">
            {cameraPermission === "denied" && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <Settings className="w-5 h-5 shrink-0" />
                <p>Camera access is blocked. Please enable it in browser settings to take photos.</p>
              </div>
            )}

            <div
              className={`flex flex-col items-center justify-center p-6 sm:p-20 border-2 border-dashed rounded-[1.5rem] sm:rounded-[2.5rem] transition-all cursor-pointer ${isDragging ? "border-white bg-text-primary/10 scale-[1.02]" : "border-border-color bg-background/40 hover:border-white/30"
                }`}
              onClick={() => {
                if (cameraPermission === "prompt") {
                  handleRequestCamera();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg"><Camera className="w-5 h-5 sm:w-7 sm:h-7" /></div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary border border-border-color shadow-lg"><ImageIcon className="w-5 h-5 sm:w-7 sm:h-7" /></div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-text-primary text-center uppercase tracking-tight">
                {cameraPermission === "prompt" ? "Enable Camera & Upload" : "Tap to Upload"}
              </p>
              <p className="text-[10px] sm:text-sm text-text-muted text-center mt-2 sm:mt-3 font-medium px-4">JPEG, PNG — High quality photos work best</p>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-square sm:aspect-video bg-background/40 rounded-[2rem] overflow-hidden flex items-center justify-center border border-border-color shadow-inner group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-transform duration-500"
              style={{ transform: `rotate(${rotation}deg)` }}
            />

            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleRemoveImage} className="bg-background/60 backdrop-blur-md border border-border-color/20 text-text-primary w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-background transition-all active:scale-90"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <button onClick={handleRotate} className="bg-background/60 backdrop-blur-md border border-border-color/20 text-text-primary w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-background transition-all active:scale-90"><RotateCw className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>

            {/* Mobile-visible Rotate Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
              <button onClick={handleRotate} className="bg-background/80 backdrop-blur-md border border-white/10 text-text-primary px-6 py-3 rounded-full flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-90 transition-all">
                <RotateCw className="w-4 h-4" /> Rotate Image
              </button>
            </div>
          </div>
        )}

        {preview && (
          <form onSubmit={handleSave} className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-3 sm:col-span-2">
                <label className="text-[10px] sm:text-sm font-black text-text-muted ml-1 uppercase tracking-[0.2em]">Name / Title</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vintage Denim Jacket" className="w-full bg-background border border-border-color rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-5 sm:px-6 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-text-primary/30 focus:ring-1 focus:ring-text-primary/30 transition-all font-medium text-sm sm:text-base" required />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-text-muted ml-1 uppercase tracking-widest">Type</label>
                {!isCustomType ? (
                  <select value={type} onChange={(e) => { if (e.target.value === "custom") { setIsCustomType(true); setType(""); } else { setType(e.target.value); } }} className="w-full bg-background border border-border-color rounded-2xl py-4 px-6 text-text-primary appearance-none font-medium cursor-pointer focus:border-text-primary/30 transition-all" required>
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
                      className="w-full bg-background border border-border-color rounded-2xl py-4 px-6 text-text-primary font-medium placeholder:text-text-muted/40"
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
                  <select value={color} onChange={(e) => { if (e.target.value === "custom") { setIsCustomColor(true); setColor(""); } else { setColor(e.target.value); } }} className="w-full bg-background border border-border-color rounded-2xl py-4 px-6 text-text-primary appearance-none font-medium cursor-pointer focus:border-text-primary/30 transition-all" required>
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
                      className="w-full bg-background border border-border-color rounded-2xl py-4 px-6 text-text-primary font-medium placeholder:text-text-muted/40"
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

              <div className="relative group flex items-center justify-between p-6 sm:p-8 bg-text-primary/[0.03] dark:bg-white/[0.03] rounded-[2rem] sm:rounded-3xl border border-border-color/30 sm:col-span-2 hover:bg-text-primary/[0.05] dark:hover:bg-white/[0.05] transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-text-primary font-black text-base sm:text-xl uppercase tracking-tight leading-none">Remove Background</p>
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-text-primary/10 text-text-primary text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-text-primary/10 leading-none h-4.5 sm:h-5">AI Studio</span>
                    </div>
                    <p className="text-text-muted text-[10px] sm:text-sm font-medium leading-none">Isolate the item automatically</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShouldRemoveBg(!shouldRemoveBg)} 
                  className={`w-14 h-8 sm:w-16 sm:h-9 rounded-full transition-all duration-500 relative border-2 shrink-0 ${
                    shouldRemoveBg 
                      ? 'bg-[image:var(--gradient-primary)] dark:bg-none dark:bg-white border-transparent dark:border-white shadow-[0_0_15px_rgba(79,110,247,0.4)] dark:shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                      : 'bg-text-primary/10 border-border-color'
                  }`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full transition-all duration-500 shadow-xl ${
                    shouldRemoveBg 
                      ? 'left-6.5 sm:left-8 bg-white dark:bg-black' 
                      : 'left-0.5 sm:left-1 bg-text-muted'
                  }`} />
                </button>
              </div>

              <div className="space-y-4 sm:col-span-2 pt-4 border-t border-white/5">
                <label className="text-[10px] sm:text-sm font-black text-text-muted ml-1 uppercase tracking-[0.2em]">Occasion / Category</label>
                <div className="flex overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 sm:gap-3 pb-2 sm:pb-0">
                  {[
                    { label: 'Any', value: 'all' },
                    { label: 'Casual', value: 'casual' },
                    { label: 'Formal', value: 'formal' },
                    { label: 'Party', value: 'party' },
                    { label: 'Street', value: 'streetwear' },
                    { label: 'Gym', value: 'athletic' }
                  ].map(cat => (
                    <button key={cat.value} type="button" onClick={() => { setCategory(cat.value); setIsCustomCategory(false); }} className={`shrink-0 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${category === cat.value && !isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                      {cat.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setIsCustomCategory(true); setCategory(""); }} className={`shrink-0 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${isCustomCategory ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                    Custom
                  </button>
                </div>
                {isCustomCategory && (
                  <div className="relative mt-4 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      list="clothing-occasions"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Type custom occasion..."
                      className="w-full bg-background border border-border-color rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-5 sm:px-6 text-text-primary font-medium focus:outline-none focus:border-text-primary/30 text-sm sm:text-base placeholder:text-text-muted/40"
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
                <label className="text-[10px] sm:text-sm font-black text-text-muted ml-1 uppercase tracking-[0.2em]">Seasons</label>
                <div className="flex overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 sm:gap-3 pb-2 sm:pb-0">
                  <button type="button" onClick={setAllWeather} className={`shrink-0 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${weather.includes('all') ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                    {weather.includes('all') && <Check className="w-3 h-3 sm:w-4 sm:h-4" />} All Weather
                  </button>
                  {['Summer', 'Winter', 'Rainy', 'Spring'].map(w => (
                    <button key={w} type="button" onClick={() => toggleWeather(w.toLowerCase())} className={`shrink-0 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${weather.includes(w.toLowerCase()) ? 'bg-text-primary text-background border-white shadow-xl scale-105' : 'bg-text-primary/5 text-text-muted border-border-color hover:border-white/30 hover:text-text-primary'}`}>
                      {weather.includes(w.toLowerCase()) && <Check className="w-3 h-3 sm:w-4 sm:h-4" />} {w === 'Spring' ? 'Spring/Fall' : w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={!type || !color || !category} className="w-full rounded-[2rem] px-4 py-6 bg-text-primary text-background font-black text-xs sm:text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-text-primary/90 active:scale-95 transition-all disabled:opacity-30 shadow-2xl mt-12 group overflow-hidden relative">
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10">Save to Wardrobe</span>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
