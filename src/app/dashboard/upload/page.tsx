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

  const handleOpenCamera = async () => {
    if (cameraPermission === "prompt") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        stream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
        setCameraPermission("granted");
      } catch (err) {
        console.error("Camera request error:", err);
        setCameraPermission("denied");
        toast("Camera access denied. Please enable it in your browser settings.", "error");
        return;
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      // Delay to ensure hardware release on Android
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 150);
    }
  };

  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
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
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 pb-24 px-4 sm:px-0">
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary uppercase leading-tight italic">
          Add to <span className="text-transparent bg-clip-text bg-[image:var(--gradient-primary)]">Wardrobe</span>
        </h1>
        <p className="text-text-muted font-medium text-base sm:text-xl max-w-2xl">Elevate your collection with high-fidelity studio uploads.</p>
      </div>

      <div className="bg-card-background/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group/container">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        {!preview ? (
          <div className="space-y-6">
            {cameraPermission === "denied" && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <Settings className="w-5 h-5 shrink-0" />
                <p>Camera access is blocked. Please enable it in browser settings to take photos.</p>
              </div>
            )}

            <div
              className={`relative flex flex-col items-center justify-center p-4 sm:p-16 border-2 border-dashed rounded-[2rem] sm:rounded-[3rem] transition-all duration-500 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/5 bg-black/20 hover:border-white/20"
                }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl mx-auto relative z-10">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="relative group flex flex-col items-center gap-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-[2rem] p-8 sm:p-12 transition-all duration-500 overflow-hidden"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-[image:var(--gradient-primary)] flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,110,247,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tighter">Camera</p>
                    <p className="text-xs sm:text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">Snap Studio</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="relative group flex flex-col items-center gap-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-[2rem] p-8 sm:p-12 transition-all duration-500 overflow-hidden"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-white/10 flex items-center justify-center text-text-primary border border-white/10 shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tighter">Gallery</p>
                    <p className="text-xs sm:text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">Import File</p>
                  </div>
                </button>
              </div>

              <div className="mt-10 text-center opacity-40 group-hover/container:opacity-100 transition-opacity duration-700">
                <p className="text-[10px] sm:text-xs text-text-muted font-black uppercase tracking-[0.4em]">
                  Drag & Drop Studio
                </p>
              </div>
              
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

              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted ml-2 uppercase tracking-[0.3em]">Type</label>
                {!isCustomType ? (
                  <div className="relative group">
                    <select value={type} onChange={(e) => { if (e.target.value === "custom") { setIsCustomType(true); setType(""); } else { setType(e.target.value); } }} className="w-full bg-black/40 border border-white/5 hover:border-white/20 rounded-[1.5rem] py-5 px-8 text-text-primary appearance-none font-bold cursor-pointer transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none" required>
                      <option value="" disabled className="bg-background">Select Style...</option>
                      <option value="top" className="bg-background">Top</option><option value="bottom" className="bg-background">Bottom</option><option value="one-piece" className="bg-background">One-piece</option><option value="shoes" className="bg-background">Shoes</option><option value="custom" className="bg-background">Other / Custom...</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-primary transition-colors">
                      <Plus className="w-5 h-5 rotate-45" />
                    </div>
                  </div>
                ) : (
                  <div className="relative animate-in slide-in-from-left-4">
                    <input
                      type="text"
                      list="clothing-types"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Enter custom type..."
                      className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] py-5 px-8 text-text-primary font-bold placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      autoFocus
                      required
                    />
                    <datalist id="clothing-types">
                      {CLOTHING_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomType(false)} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary bg-white/5 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted ml-2 uppercase tracking-[0.3em]">Color</label>
                {!isCustomColor ? (
                  <div className="relative group">
                    <select value={color} onChange={(e) => { if (e.target.value === "custom") { setIsCustomColor(true); setColor(""); } else { setColor(e.target.value); } }} className="w-full bg-black/40 border border-white/5 hover:border-white/20 rounded-[1.5rem] py-5 px-8 text-text-primary appearance-none font-bold cursor-pointer transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none" required>
                      <option value="" disabled className="bg-background">Select Tone...</option>
                      <option value="black" className="bg-background">Black</option><option value="white" className="bg-background">White</option><option value="blue" className="bg-background">Blue</option><option value="red" className="bg-background">Red</option><option value="green" className="bg-background">Green</option><option value="custom" className="bg-background">Other / Custom...</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-primary transition-colors">
                      <Plus className="w-5 h-5 rotate-45" />
                    </div>
                  </div>
                ) : (
                  <div className="relative animate-in slide-in-from-right-4">
                    <input
                      type="text"
                      list="clothing-colors"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Enter custom color..."
                      className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] py-5 px-8 text-text-primary font-bold placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      autoFocus
                      required
                    />
                    <datalist id="clothing-colors">
                      {CLOTHING_COLORS.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <button type="button" onClick={() => setIsCustomColor(false)} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary bg-white/5 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
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

            <button type="submit" disabled={!type || !color || !category} className="w-full rounded-[2.5rem] px-4 py-8 bg-[image:var(--gradient-primary)] text-white font-black text-sm sm:text-lg uppercase tracking-[0.4em] flex items-center justify-center gap-6 hover:shadow-[0_20px_50px_rgba(79,110,247,0.4)] active:scale-95 transition-all disabled:opacity-30 disabled:hover:shadow-none shadow-2xl mt-16 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-4">
                Save to Wardrobe
                <Plus className="w-5 h-5 sm:w-7 sm:h-7 group-hover:rotate-180 transition-transform duration-700" />
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
