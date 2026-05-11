"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shirt, Sparkles, WashingMachine, Upload } from "lucide-react";

const mobileNavItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wardrobe", href: "/dashboard/wardrobe", icon: Shirt },
  { name: "Add", href: "/dashboard/upload", icon: Upload },
  { name: "Outfits", href: "/dashboard/outfits", icon: Sparkles },
  { name: "Laundry", href: "/dashboard/laundry", icon: WashingMachine },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl border-t border-border-color" />

      <nav className="relative flex items-center justify-around h-20 px-4 pb-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 active:scale-90 ${isActive ? "text-text-primary" : "text-text-muted hover:text-text-muted"
                }`}
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-500 ${isActive ? "bg-text-primary/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20" : "bg-transparent"
                }`}>
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110" : "scale-100"}`} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -inset-1 bg-text-primary/5 rounded-2xl blur-lg animate-pulse" />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
