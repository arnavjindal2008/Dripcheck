import Link from "next/link";
import { ArrowRight, Sparkles, Shirt, WashingMachine } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden transition-colors duration-300">

      {/* Sleek, professional background glow using logo gradient */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[image:var(--gradient-primary)] opacity-[0.08] dark:opacity-[0.15] blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-3xl flex flex-col items-center text-center z-10 space-y-8 mt-10 sm:mt-0 w-full">

        {/* Logo */}
        <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <img src="/logo.png" alt="DripCheck Outfit Creator" className="h-48 w-auto object-contain drop-shadow-xl" />
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[image:var(--gradient-card)] text-text-primary text-sm font-bold border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>AI-Powered Wardrobe Manager</span>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-text-primary animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          Your Digital <span className="text-transparent bg-clip-text bg-[image:var(--gradient-primary)] dark:drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]">Wardrobe</span>
        </h1>

        <p className="text-lg sm:text-xl text-text-muted max-w-xl animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-500">
          Upload clothes, automatically remove backgrounds, and generate stunning outfits using AI. The future of fashion is in your pocket.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
          {user ? (
            <Link
              href="/dashboard"
              className="group flex items-center justify-center gap-3 bg-[image:var(--gradient-primary)] text-white px-10 py-5 rounded-2xl font-black text-xl hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 shadow-[var(--shadow-lg)] border border-white/10"
            >
              Go to Dashboard
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2 bg-[image:var(--gradient-primary)] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 shadow-[var(--shadow-lg)]"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-card-background text-text-primary border border-border-color backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg hover:bg-text-primary/5 hover:scale-[1.02] transition-all active:scale-95"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full text-left animate-in fade-in duration-1000 delay-1000">
          {[
            { title: "AI Background Removal", desc: "Instantly clean up your clothing photos.", icon: Shirt },
            { title: "Outfit Generator", desc: "Let AI pick the perfect outfit for any occasion.", icon: Sparkles },
            { title: "Laundry Tracker", desc: "Know exactly what's clean and what's in the wash.", icon: WashingMachine }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card-background border border-border-color flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1 shadow-sm group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-text-primary text-lg">{feature.title}</h3>
              <p className="text-sm text-text-muted font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
